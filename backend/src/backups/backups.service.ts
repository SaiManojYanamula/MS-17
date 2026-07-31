import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mysqldump from 'mysqldump';
import { gzipSync } from 'zlib';

const KEY_PREFIX = 'db-backups/';
const RETENTION_COUNT = 14; // keep the last 14 backups (~2 weeks of daily runs)
const DOWNLOAD_URL_TTL_SECONDS = 300;

@Injectable()
export class BackupsService {
  private readonly logger = new Logger(BackupsService.name);
  private client: S3Client | null = null;
  private bucket: string | undefined;

  private getClient(): { client: S3Client; bucket: string } {
    if (!this.bucket) this.bucket = process.env.R2_BACKUP_BUCKET_NAME;
    if (!this.bucket) {
      throw new InternalServerErrorException(
        'R2_BACKUP_BUCKET_NAME is not configured — create a private R2 bucket for backups and set this env var.',
      );
    }
    if (!this.client) {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
        },
      });
    }
    return { client: this.client, bucket: this.bucket };
  }

  // 3 AM — low-traffic hour for this app's users.
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleScheduledBackup() {
    try {
      await this.runBackup();
    } catch (err) {
      this.logger.error('Scheduled DB backup failed', err as Error);
    }
  }

  async runBackup(): Promise<{ key: string; sizeBytes: number }> {
    const { client, bucket } = this.getClient();

    const dump = await this.dumpDatabase();
    const compressed = gzipSync(dump);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `${KEY_PREFIX}${timestamp}.sql.gz`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: compressed,
        ContentType: 'application/gzip',
      }),
    );

    this.logger.log(`DB backup uploaded: ${key} (${compressed.length} bytes)`);
    await this.enforceRetention();

    return { key, sizeBytes: compressed.length };
  }

  // Pure-JS dump (mysql2 driver under the hood) rather than shelling out to
  // the native mysqldump binary — MySQL 8's default caching_sha2_password
  // auth plugin isn't supported by the MariaDB client tools available on
  // Alpine, which made the native binary fail to even connect.
  private async dumpDatabase(): Promise<Buffer> {
    const url = new URL(process.env.DATABASE_URL as string);
    const database = url.pathname.replace(/^\//, '');

    const result = await mysqldump({
      connection: {
        host: url.hostname,
        port: Number(url.port || '3306'),
        user: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database,
      },
    });

    const sql = [result.dump.schema, result.dump.data, result.dump.trigger].filter(Boolean).join('\n\n');
    return Buffer.from(sql, 'utf-8');
  }

  async listBackups() {
    const { client, bucket } = this.getClient();
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: KEY_PREFIX }),
    );
    return (res.Contents ?? [])
      .map((o) => ({ key: o.Key!, sizeBytes: o.Size ?? 0, lastModified: o.LastModified }))
      .sort((a, b) => (b.lastModified?.getTime() ?? 0) - (a.lastModified?.getTime() ?? 0));
  }

  private async enforceRetention() {
    const backups = await this.listBackups();
    const toDelete = backups.slice(RETENTION_COUNT);
    if (toDelete.length === 0) return;

    const { client, bucket } = this.getClient();
    await Promise.all(
      toDelete.map((b) => client.send(new DeleteObjectCommand({ Bucket: bucket, Key: b.key }))),
    );
    this.logger.log(`Pruned ${toDelete.length} old backup(s) beyond retention of ${RETENTION_COUNT}`);
  }

  async getDownloadUrl(key: string): Promise<string> {
    if (!key.startsWith(KEY_PREFIX)) {
      throw new InternalServerErrorException('Invalid backup key');
    }
    const { client, bucket } = this.getClient();
    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(client, command, { expiresIn: DOWNLOAD_URL_TTL_SECONDS });
  }
}
