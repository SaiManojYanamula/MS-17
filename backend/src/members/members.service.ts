import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma.service';

const DEFAULT_STUDENT_PASSWORD = '1234';
const SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7-day "expiring soon" window

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  // Status is derived live from expiresAt, never trusted from the stored
  // column — a member's row doesn't get touched by the passage of time, so a
  // stored "Active" string would silently go stale the moment expiresAt passes.
  private computeStatus(expiresAt: Date, now = new Date()): string {
    if (expiresAt.getTime() < now.getTime()) return 'Expired';
    if (expiresAt.getTime() <= now.getTime() + SOON_WINDOW_MS) return 'Expiring Soon';
    return 'Active';
  }

  private withComputedStatus<T extends { expiresAt: Date }>(member: T): T & { status: string } {
    return { ...member, status: this.computeStatus(member.expiresAt) };
  }

  // tenantId is ALWAYS required — this is the row-level isolation enforcement point
  async findAll(tenantId: string, filter?: 'active' | 'expiring' | 'expired', search?: string) {
    const now = new Date();
    const soon = new Date(now.getTime() + SOON_WINDOW_MS);

    const where: any = { tenantId };

    if (filter === 'active') where.expiresAt = { gt: soon };
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

    return { members: members.map((m) => this.withComputedStatus(m)), counts };
  }

  async getCounts(tenantId: string) {
    const now = new Date();
    const soon = new Date(now.getTime() + SOON_WINDOW_MS);

    const [all, active, expiring, expired] = await Promise.all([
      this.prisma.member.count({ where: { tenantId } }),
      this.prisma.member.count({ where: { tenantId, expiresAt: { gt: soon } } }),
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
      include: {
        seat: true,
        payments: true,
        branch: true,
        user: { select: { id: true, email: true } },
      },
    });

    if (!member) throw new NotFoundException('Member not found');
    return this.withComputedStatus(member);
  }

  // Expiry always follows the join date + plan length — never picked
  // independently, so a member's expiry can't drift out of sync with when
  // they actually joined (matches ApplicationsService's approve() logic).
  private computeExpiry(plan: string, from: Date): Date {
    const d = new Date(from);
    if (plan === 'MONTHLY') return new Date(d.setMonth(d.getMonth() + 1));
    if (plan === 'QUARTERLY') return new Date(d.setMonth(d.getMonth() + 3));
    return new Date(d.setDate(d.getDate() + 1)); // DAILY_PASS
  }

  async create(tenantId: string, branchId: string, data: any) {
    const displayId = await this.generateDisplayId(tenantId);
    const joinedAt = data.joinedAt ? new Date(data.joinedAt) : new Date();
    const expiresAt = this.computeExpiry(data.plan, joinedAt);
    const member = await this.prisma.member.create({
      data: { ...data, tenantId, branchId, displayId, joinedAt, expiresAt },
    });
    if (member.phone) {
      await this.createLoginIfMissing(tenantId, branchId, member.id, member.name, member.phone);
    }
    return this.findOne(tenantId, member.id);
  }

  // e.g. "AKR-2214" — first 3 letters of the tenant slug + a running count of
  // members in that tenant. Shown to the student as their Student ID.
  private async generateDisplayId(tenantId: string) {
    const [tenant, count] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } }),
      this.prisma.member.count({ where: { tenantId } }),
    ]);
    const prefix = (tenant?.slug ?? 'MEM').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'MEM';
    return `${prefix}-${String(count + 1).padStart(4, '0')}`;
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
