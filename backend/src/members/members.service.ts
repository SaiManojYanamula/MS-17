import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

const DEFAULT_STUDENT_PASSWORD = '1234';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  // tenantId is ALWAYS required — this is the row-level isolation enforcement point
  async findAll(tenantId: string, filter?: 'active' | 'expiring' | 'expired', search?: string) {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7-day window

    const where: any = { tenantId };

    if (filter === 'active') where.status = 'Active';
    if (filter === 'expiring') where.expiresAt = { gte: now, lte: soon };
    if (filter === 'expired') where.expiresAt = { lt: now };

    if (search) {
      where.name = { contains: search };
    }

    const members = await this.prisma.member.findMany({
      where,
      include: { seat: true, branch: true, user: { select: { id: true, email: true } } },
      orderBy: { joinedAt: 'desc' },
    });

    const counts = await this.getCounts(tenantId);

    return { members, counts };
  }

  async getCounts(tenantId: string) {
    const now = new Date();
    const soon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [all, active, expiring, expired] = await Promise.all([
      this.prisma.member.count({ where: { tenantId } }),
      this.prisma.member.count({ where: { tenantId, status: 'Active' } }),
      this.prisma.member.count({
        where: { tenantId, expiresAt: { gte: now, lte: soon } },
      }),
      this.prisma.member.count({ where: { tenantId, expiresAt: { lt: now } } }),
    ]);

    return { all, active, expiring, expired };
  }

  async findOne(tenantId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, tenantId }, // tenantId check prevents cross-tenant access
      include: { seat: true, payments: true, user: { select: { id: true, email: true } } },
    });

    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  async create(tenantId: string, branchId: string, data: any) {
    const member = await this.prisma.member.create({
      data: { ...data, tenantId, branchId },
    });
    if (member.phone) {
      await this.createLoginIfMissing(tenantId, branchId, member.id, member.name, member.phone);
    }
    return this.findOne(tenantId, member.id);
  }

  async update(tenantId: string, id: string, data: any) {
    const existing = await this.findOne(tenantId, id); // ensures tenant ownership before mutating
    const member = await this.prisma.member.update({ where: { id }, data });
    if (member.phone && !existing.user) {
      await this.createLoginIfMissing(tenantId, existing.branchId, member.id, member.name, member.phone);
    }
    return this.findOne(tenantId, id);
  }

  // Every member with a phone number gets a STUDENT portal login automatically
  // — phone number as the username, "1234" as the default password. Silently
  // skipped if that phone is already taken by a login (e.g. reused across
  // tenants) since User.email is globally unique — staff can retry with a
  // different number via Edit.
  private async createLoginIfMissing(
    tenantId: string,
    branchId: string,
    memberId: string,
    name: string,
    phone: string,
  ) {
    try {
      const hashed = await bcrypt.hash(DEFAULT_STUDENT_PASSWORD, 10);
      await this.prisma.user.create({
        data: { tenantId, branchId, name, email: phone, password: hashed, role: 'STUDENT', memberId },
      });
    } catch {
      // unique constraint on email(phone) — leave the member without a login
    }
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id); // ensures tenant ownership before mutating

    // Free up any seat and clear payment history first — both have a
    // required/unique FK to Member and would otherwise block the delete.
    await this.prisma.$transaction([
      this.prisma.seat.updateMany({ where: { memberId: id }, data: { memberId: null, status: 'FREE' } }),
      this.prisma.payment.deleteMany({ where: { memberId: id } }),
      this.prisma.member.delete({ where: { id } }),
    ]);

    return { success: true };
  }
}
