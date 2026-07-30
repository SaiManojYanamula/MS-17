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

  // Adds `count` more seats to an existing zone, numbered right after the
  // branch's actual highest seat number — not the zone's stored endSeat,
  // which can go stale (e.g. deleting the zone's last seat leaves endSeat
  // pointing at a number that no longer exists, which would silently
  // re-create a "deleted" seat number instead of continuing forward).
  async addSeatsToZone(tenantId: string, branchId: string, zoneId: string, count: number) {
    if (!Number.isInteger(count) || count < 1) {
      throw new BadRequestException('Enter a valid number of seats to add');
    }

    const zone = await this.prisma.zone.findFirst({ where: { id: zoneId, tenantId, branchId } });
    if (!zone) throw new NotFoundException('Zone not found');

    const highest = await this.prisma.seat.aggregate({
      where: { branchId },
      _max: { seatNumber: true },
    });
    const startSeat = Math.max(highest._max.seatNumber ?? 0, zone.endSeat) + 1;
    const endSeat = startSeat + count - 1;

    await this.prisma.$transaction([
      this.prisma.seat.createMany({
        data: Array.from({ length: count }, (_, i) => ({
          tenantId,
          branchId,
          zoneId: zone.id,
          seatNumber: startSeat + i,
          status: 'FREE' as const,
        })),
      }),
      this.prisma.zone.update({ where: { id: zoneId }, data: { endSeat } }),
    ]);

    return this.prisma.zone.findUnique({ where: { id: zoneId }, include: { seats: true } });
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

  async deleteSeat(tenantId: string, seatId: string) {
    const seat = await this.prisma.seat.findFirst({ where: { id: seatId, tenantId } });
    if (!seat) throw new NotFoundException('Seat not found');
    if (seat.memberId) {
      throw new BadRequestException('Release this seat before deleting it');
    }

    await this.prisma.seat.delete({ where: { id: seatId } });

    // If this was the zone's last (highest-numbered) seat, shrink the zone's
    // stored range to match reality instead of leaving it pointing past the
    // end of what actually exists.
    const zone = await this.prisma.zone.findUnique({ where: { id: seat.zoneId } });
    if (zone && seat.seatNumber === zone.endSeat) {
      const remaining = await this.prisma.seat.aggregate({
        where: { zoneId: seat.zoneId },
        _max: { seatNumber: true },
      });
      await this.prisma.zone.update({
        where: { id: seat.zoneId },
        data: { endSeat: remaining._max.seatNumber ?? zone.startSeat },
      });
    }

    return { success: true };
  }
}
