import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// No real study hall has anywhere near this many physical seats — this
// exists purely to catch a typo in the End Seat field (e.g. an extra digit
// producing 100,000+ seats) before it creates rows that make the Seating
// page unusable to even load.
const MAX_SEATS_PER_ZONE = 1000;

@Injectable()
export class SeatingService {
  constructor(private prisma: PrismaService) {}

  // Creates a Zone and generates one Seat row per number in [startSeat, endSeat].
  async createZone(
    tenantId: string,
    branchId: string,
    data: { name: string; startSeat: number; endSeat: number },
  ) {
    const name = data.name.trim();
    const { startSeat, endSeat } = data;
    if (!name) {
      throw new BadRequestException('Zone name is required');
    }
    if (!Number.isInteger(startSeat) || !Number.isInteger(endSeat) || startSeat > endSeat) {
      throw new BadRequestException('Start seat must be less than or equal to end seat');
    }
    if (endSeat - startSeat + 1 > MAX_SEATS_PER_ZONE) {
      throw new BadRequestException(
        `A zone can have at most ${MAX_SEATS_PER_ZONE} seats — check the End Seat number for a typo`,
      );
    }

    const overlap = await this.prisma.seat.findFirst({
      where: { branchId, seatNumber: { gte: startSeat, lte: endSeat } },
    });
    if (overlap) {
      throw new BadRequestException(`Seat number ${overlap.seatNumber} is already used in this branch`);
    }

    const nameTaken = await this.prisma.zone.findFirst({ where: { branchId, name } });
    if (nameTaken) {
      throw new BadRequestException(`A zone named "${name}" already exists in this branch`);
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
    if (count > MAX_SEATS_PER_ZONE) {
      throw new BadRequestException(
        `Add at most ${MAX_SEATS_PER_ZONE} seats at a time — check for a typo`,
      );
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

  // Renaming is the only way to fix a zone that ended up with a duplicate
  // or wrong name (e.g. two zones both named "A") since createZone only
  // blocks duplicates going forward, not existing ones.
  async renameZone(tenantId: string, branchId: string, zoneId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Zone name is required');
    }

    const zone = await this.prisma.zone.findFirst({ where: { id: zoneId, tenantId, branchId } });
    if (!zone) throw new NotFoundException('Zone not found');

    const nameTaken = await this.prisma.zone.findFirst({
      where: { branchId, name: trimmed, NOT: { id: zoneId } },
    });
    if (nameTaken) {
      throw new BadRequestException(`A zone named "${trimmed}" already exists in this branch`);
    }

    return this.prisma.zone.update({ where: { id: zoneId }, data: { name: trimmed } });
  }

  async updateZoneImage(tenantId: string, branchId: string, zoneId: string, imageUrl: string | null) {
    const zone = await this.prisma.zone.findFirst({ where: { id: zoneId, tenantId, branchId } });
    if (!zone) throw new NotFoundException('Zone not found');
    return this.prisma.zone.update({ where: { id: zoneId }, data: { imageUrl } });
  }

  // Refuses to delete a zone with any occupied seats — students sitting
  // there would silently lose their seat with no record of where. Free
  // (or already-released) seats are deleted along with the zone itself,
  // so a mistakenly oversized zone (e.g. a typo'd End Seat) can be cleaned
  // up from the UI instead of needing a manual DB fix.
  async deleteZone(tenantId: string, branchId: string, zoneId: string) {
    const zone = await this.prisma.zone.findFirst({ where: { id: zoneId, tenantId, branchId } });
    if (!zone) throw new NotFoundException('Zone not found');

    const occupiedCount = await this.prisma.seat.count({
      where: { zoneId, status: { not: 'FREE' } },
    });
    if (occupiedCount > 0) {
      throw new BadRequestException(
        `${occupiedCount} seat(s) in this zone still have a member — release them first before deleting the zone`,
      );
    }

    await this.prisma.$transaction([
      this.prisma.seat.deleteMany({ where: { zoneId } }),
      this.prisma.zone.delete({ where: { id: zoneId } }),
    ]);

    return { success: true };
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

    // The target seat already belongs to someone else — overwriting its
    // memberId here would silently bump that member off their seat with no
    // record of it (they'd just appear seatless). Require staff to release
    // that seat first, so this is always a deliberate action.
    if (seat.memberId && seat.memberId !== memberId) {
      const currentOccupant = await this.prisma.member.findUnique({
        where: { id: seat.memberId },
        select: { name: true },
      });
      throw new BadRequestException(
        `Seat ${seat.seatNumber} is already occupied by ${currentOccupant?.name ?? 'another member'} — release it first.`,
      );
    }

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
