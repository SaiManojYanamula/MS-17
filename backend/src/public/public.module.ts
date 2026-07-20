import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PrismaService } from '../prisma.service';
import { ApplicationsService } from '../applications/applications.service';

@Module({
  controllers: [PublicController],
  providers: [PrismaService, ApplicationsService],
})
export class PublicModule {}
