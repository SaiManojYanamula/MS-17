import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { MembersService } from '../members/members.service';

@Injectable()
export class RequestsService {
  constructor(
    private prisma: PrismaService,
    private membersService: MembersService,
  ) {}

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
    data: { type: string; message: string; amount?: number; screenshotUrl?: string },
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

    return this.prisma.request.update({ where: { id }, data: { status: 'RESOLVED' } });
  }
}
