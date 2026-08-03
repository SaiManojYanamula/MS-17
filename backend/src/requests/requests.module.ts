import { Module } from '@nestjs/common';
import { RequestsController } from './requests.controller';
import { RequestsService } from './requests.service';
import { PrismaService } from '../prisma.service';
import { MembersModule } from '../members/members.module';
import { SeatingModule } from '../seating/seating.module';

@Module({
  imports: [MembersModule, SeatingModule],
  controllers: [RequestsController],
  providers: [RequestsService, PrismaService],
})
export class RequestsModule {}
