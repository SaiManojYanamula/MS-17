import { Module } from '@nestjs/common';
import { SeatingController } from './seating.controller';
import { SeatingService } from './seating.service';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [SeatingController],
  providers: [SeatingService, PrismaService],
})
export class SeatingModule {}
