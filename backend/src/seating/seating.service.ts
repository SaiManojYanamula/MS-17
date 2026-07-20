import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SeatingService {
  constructor(private prisma: PrismaService) {}

  async getSeatMap(tenantId: string, branchId: string) {
    const zones = await this.prisma.zone.findMany({
      where: { tenantId, branchId },
      include: {
        seats: {
          include: { member: true },
          orderBy: { seatNumber: 'asc' },
        },
      },
      orderBy: { startSeat: 'asc' },
    });

    return zones;
  }

  async getSeatDetail(tenantId: string, seatId: string) {
    const seat = await this.prisma.seat.findFirst({
      where: { id: seatId, tenantId },
      include: { member: true, zone: true },
    });

    if (!seat) throw new NotFoundException('Seat not found');
    return seat;
  }

  // Assign / reassign a member to a seat. Editing an occupied seat to a
  // different member frees whatever other seat that member currently holds
  // first, so the Seat.memberId unique constraint never trips.
  async assignSeat(tenantId: string, seatId: string, memberId: string) {
    const seat = await this.prisma.seat.findFirst({ where: { id: seatId, tenantId } });
    if (!seat) throw new NotFoundException('Seat not found');

    await this.prisma.$transaction([
      this.prisma.seat.updateMany({
        where: { tenantId, memberId, NOT: { id: seatId } },
        data: { memberId: null, status: 'FREE' },
      }),
      this.prisma.seat.update({
        where: { id: seatId },
        data: { memberId, status: 'OCCUPIED' },
      }),
    ]);

    return this.prisma.seat.findFirst({ where: { id: seatId }, include: { member: true, zone: true } });
  }

  async releaseSeat(tenantId: string, seatId: string) {
    const seat = await this.prisma.seat.findFirst({ where: { id: seatId, tenantId } });
    if (!seat) throw new NotFoundException('Seat not found');

    return this.prisma.seat.update({
      where: { id: seatId },
      data: { memberId: null, status: 'FREE' },
    });
  }
}
