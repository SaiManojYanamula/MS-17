import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SeatingService {
  constructor(private prisma: PrismaService) {}

  // Creates a Zone and generates one Seat row per number in [startSeat, endSeat].
  async createZone(
    tenantId: string,
    branchId: string,
    data: { name: string; startSeat: number; endSeat: number },
  ) {
    const { name, startSeat, endSeat } = data;
    if (!Number.isInteger(startSeat) || !Number.isInteger(endSeat) || startSeat > endSeat) {
      throw new BadRequestException('Start seat must be less than or equal to end seat');
    }

    const overlap = await this.prisma.seat.findFirst({
      where: { branchId, seatNumber: { gte: startSeat, lte: endSeat } },
    });
    if (overlap) {
      throw new BadRequestException(`Seat number ${overlap.seatNumber} is already used in this branch`);
    }

    const zone = await this.prisma.zone.create({
      data: { tenantId, branchId, name, startSeat, endSeat },
    });

    await this.prisma.seat.createMany({
      data: Array.from({ length: endSeat - startSeat + 1 }, (_, i) => ({
        tenantId,
        branchId,
        zoneId: zone.id,
        seatNumber: startSeat + i,
        status: 'FREE' as const,
      })),
    });

    return this.prisma.zone.findUnique({ where: { id: zone.id }, include: { seats: true } });
  }

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
