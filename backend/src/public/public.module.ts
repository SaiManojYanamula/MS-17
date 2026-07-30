import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PrismaService } from '../prisma.service';
import { ApplicationsService } from '../applications/applications.service';
import { MembersModule } from '../members/members.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MembersModule, NotificationsModule],
  controllers: [PublicController],
  providers: [PrismaService, ApplicationsService],
})
export class PublicModule {}
