import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [NotificationsModule],
  controllers: [WebhooksController],
  providers: [PrismaService],
})
export class WebhooksModule {}
