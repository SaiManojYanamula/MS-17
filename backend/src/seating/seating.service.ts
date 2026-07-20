import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

  // Assign / reassign a member to a seat — enforces one active seat per member
  async assignSeat(tenantId: string, seatId: string, memberId: string) {
    const seat = await this.prisma.seat.findFirst({ where: { id: seatId, tenantId } });
    if (!seat) throw new NotFoundException('Seat not found');
    if (seat.status === 'OCCUPIED' && seat.memberId !== memberId) {
      throw new BadRequestException('Seat already occupied by another member');
    }

    return this.prisma.seat.update({
      where: { id: seatId },
      data: { memberId, status: 'OCCUPIED' },
    });
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
