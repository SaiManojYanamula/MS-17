import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MembersService } from '../members/members.service';
import { SeatingService } from '../seating/seating.service';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private membersService: MembersService,
    private seatingService: SeatingService,
  ) {}

  // Free seats in the caller's own branch — powers the seat picker shown
  // when a student raises a SEAT_CHANGE request.
  async availableSeats(tenantId: string, branchId: string) {
    return this.prisma.seat.findMany({
      where: { tenantId, branchId, status: 'FREE' },
      select: { id: true, seatNumber: true, zone: { select: { name: true } } },
      orderBy: { seatNumber: 'asc' },
    });
  }

  async findMine(tenantId: string, memberId: string) {
    return this.prisma.request.findMany({
      where: { tenantId, memberId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.request.findMany({
      where: { tenantId },
      include: { member: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    tenantId: string,
    branchId: string,
    memberId: string,
    data: {
      type: string;
      message: string;
      amount?: number;
      screenshotUrl?: string;
      requestedSeatNumber?: number;
    },
  ) {
    return this.prisma.request.create({
      data: {
        tenantId,
        branchId,
        memberId,
        type: data.type as any,
        message: data.message,
        amount: data.amount,
        screenshotUrl: data.screenshotUrl,
        requestedSeatNumber: data.requestedSeatNumber,
      },
    });
  }

  async resolve(tenantId: string, id: string) {
    const request = await this.prisma.request.findFirst({ where: { id, tenantId }, include: { member: true } });
    if (!request) throw new NotFoundException('Request not found');

    // A RENEWAL request with a claimed amount is a self-reported payment —
    // resolving it is staff confirming the money actually came in, so it
    // extends the membership and books the payment in one action rather
    // than leaving staff to separately renew + record it.
    if (request.type === 'RENEWAL' && request.amount) {
      const newExpiry = this.membersService.computeRenewalExpiry(request.member.plan, request.member.expiresAt);
      await this.membersService.update(tenantId, request.memberId, { expiresAt: newExpiry });
      await this.prisma.payment.create({
        data: {
          tenantId,
          branchId: request.branchId,
          memberId: request.memberId,
          amount: request.amount,
          method: 'UPI',
          status: 'PAID',
          label: `${request.member.plan} - Renewal`,
          screenshotUrl: request.screenshotUrl,
        },
      });
    }

    // A SEAT_CHANGE request names a specific free seat — resolving it moves
    // the member there in one action. If that seat got taken by someone
    // else in the meantime, the request still resolves (it's been seen and
    // actioned) but staff need to pick a different seat manually — silently
    // failing the whole resolve over a stale seat pick would be worse.
    let seatChangeNote: string | undefined;
    if (request.type === 'SEAT_CHANGE' && request.requestedSeatNumber != null) {
      const seat = await this.prisma.seat.findFirst({
        where: { tenantId, branchId: request.branchId, seatNumber: request.requestedSeatNumber },
      });
      if (seat && seat.status === 'FREE') {
        await this.seatingService.assignSeat(tenantId, seat.id, request.memberId);
      } else {
        seatChangeNote = `Seat ${request.requestedSeatNumber} is no longer free — reassign manually from Seating.`;
      }
    }

    const resolved = await this.prisma.request.update({ where: { id }, data: { status: 'RESOLVED' } });
    return seatChangeNote ? { ...resolved, note: seatChangeNote } : resolved;
  }
}
