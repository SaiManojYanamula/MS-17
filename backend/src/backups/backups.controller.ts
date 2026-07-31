import { Controller, Get, Post, Query } from '@nestjs/common';
import { BackupsService } from './backups.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('super-admin/backups')
@Roles('SUPER_ADMIN')
export class BackupsController {
  constructor(private backupsService: BackupsService) {}

  @Get()
  list() {
    return this.backupsService.listBackups();
  }

  @Post('run')
  run() {
    return this.backupsService.runBackup();
  }

  @Get('download')
  async download(@Query('key') key: string) {
    return { url: await this.backupsService.getDownloadUrl(key) };
  }
}
