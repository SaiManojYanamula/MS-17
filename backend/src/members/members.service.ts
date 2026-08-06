import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma.service';
import { addMonthsClamped } from '../common/date-utils';

const DEFAULT_STUDENT_PASSWORD = '1234';
const SOON_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7-day "expiring soon" window
// Indian mobile number: 10 digits, optionally prefixed with +91 / 0.
const PHONE_PATTERN = /^(\+?91[-\s]?|0)?[6-9]\d{9}$/;
const PLAN_ALIASES: Record<string, string> = {
  MONTHLY: 'MONTHLY',
  MONTH: 'MONTHLY',
  QUARTERLY: 'QUARTERLY',
  QUARTER: 'QUARTERLY',
  YEARLY: 'YEARLY',
  YEAR: 'YEARLY',
  ANNUAL: 'YEARLY',
  DAILY: 'DAILY_PASS',
  DAILYPASS: 'DAILY_PASS',
  DAILY_PASS: 'DAILY_PASS',
  'DAILY PASS': 'DAILY_PASS',
};

function assertValidPhone(phone?: string) {
  if (phone && !PHONE_PATTERN.test(phone.trim())) {
    throw new BadRequestException('Enter a valid 10-digit phone number');
  }
}

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
  async findAll(
    tenantId: string,
    branchId: string,
    filter?: 'active' | 'expiring' | 'expired',
    search?: string,
  ) {
    const now = new Date();
    const soon = new Date(now.getTime() + SOON_WINDOW_MS);

    const where: any = { tenantId, branchId };

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

    const counts = await this.getCounts(tenantId, branchId);

    return { members: members.map((m) => this.withComputedStatus(m)), counts };
  }

  async getCounts(tenantId: string, branchId: string) {
    const now = new Date();
    const soon = new Date(now.getTime() + SOON_WINDOW_MS);

    const [all, active, expiring, expired] = await Promise.all([
      this.prisma.member.count({ where: { tenantId, branchId } }),
      this.prisma.member.count({ where: { tenantId, branchId, expiresAt: { gt: soon } } }),
      this.prisma.member.count({
        where: { tenantId, branchId, expiresAt: { gte: now, lte: soon } },
      }),
      this.prisma.member.count({ where: { tenantId, branchId, expiresAt: { lt: now } } }),
    ]);

    return { all, active, expiring, expired };
  }

  async findOne(tenantId: string, branchId: string, id: string) {
    const member = await this.prisma.member.findFirst({
      where: { id, tenantId, branchId }, // tenantId+branchId check prevents cross-tenant/cross-branch access
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
    if (plan === 'MONTHLY') return addMonthsClamped(from, 1);
    if (plan === 'QUARTERLY') return addMonthsClamped(from, 3);
    if (plan === 'YEARLY') return addMonthsClamped(from, 12);
    const d = new Date(from);
    return new Date(d.setDate(d.getDate() + 1)); // DAILY_PASS
  }

  // A renewal extends from whichever is later — the current expiry (if it
  // hasn't passed yet) or now — so renewing early never loses paid-for days,
  // and renewing late never backdates from an already-expired date.
  computeRenewalExpiry(plan: string, currentExpiresAt: Date): Date {
    const from = currentExpiresAt.getTime() > Date.now() ? currentExpiresAt : new Date();
    return this.computeExpiry(plan, from);
  }

  // Admin-side renewal — same effect as staff resolving a student's portal
  // renewal request (extend expiry + book the payment), for a student who
  // paid in person or by phone instead of through the portal.
  async renew(tenantId: string, branchId: string, memberId: string, amount: number, method: string) {
    const member = await this.findOne(tenantId, branchId, memberId);
    const newExpiry = this.computeRenewalExpiry(member.plan, member.expiresAt);
    await this.update(tenantId, branchId, memberId, { expiresAt: newExpiry });
    await this.prisma.payment.create({
      data: {
        tenantId,
        branchId,
        memberId,
        amount,
        method: method as any,
        status: 'PAID',
        label: `${member.plan} - Renewal`,
      },
    });
    return this.findOne(tenantId, branchId, memberId);
  }

  async create(tenantId: string, branchId: string, data: any) {
    assertValidPhone(data.phone);
    // Same phone re-added while their existing membership is still active
    // (e.g. a day pass holder immediately "added" again as Monthly) would
    // silently create a second Member row whose portal login then fails to
    // create at all (User.email=phone is globally unique) — block it up
    // front instead. A genuinely expired member is fine to re-register.
    if (data.phone) {
      const existing = await this.prisma.member.findFirst({
        where: { tenantId, phone: data.phone, expiresAt: { gt: new Date() } },
      });
      if (existing) {
        throw new BadRequestException(
          `This phone number already belongs to an active member (${existing.name}) — edit or renew that member instead of adding a new one.`,
        );
      }
    }
    const displayId = await this.generateDisplayId(tenantId);
    const joinedAt = data.joinedAt ? new Date(data.joinedAt) : new Date();
    const expiresAt = this.computeExpiry(data.plan, joinedAt);
    const member = await this.prisma.member.create({
      data: { ...data, tenantId, branchId, displayId, joinedAt, expiresAt },
    });
    if (member.phone) {
      await this.createLoginIfMissing(tenantId, branchId, member.id, member.name, member.phone);
    }
    return this.findOne(tenantId, branchId, member.id);
  }

  // e.g. "AKR-2214" — first 3 letters of the tenant slug + a running count of
  // members in that tenant. Shown to the student as their Student ID.
  // Based on the highest displayId actually in use, not a row count —
  // count() drifts the moment any member is ever deleted (count goes down,
  // but the higher-numbered displayId is still taken), which silently
  // regenerates a displayId that collides with an existing one and trips
  // the unique constraint on every retry (seen in production).
  private async generateDisplayId(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } });
    const prefix = (tenant?.slug ?? 'MEM').replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase() || 'MEM';

    const last = await this.prisma.member.findFirst({
      where: { tenantId, displayId: { startsWith: `${prefix}-` } },
      orderBy: { displayId: 'desc' },
      select: { displayId: true },
    });
    const lastNum = last?.displayId ? parseInt(last.displayId.split('-')[1], 10) || 0 : 0;
    return `${prefix}-${String(lastNum + 1).padStart(4, '0')}`;
  }

  async update(tenantId: string, branchId: string, id: string, data: any) {
    assertValidPhone(data.phone);
    const existing = await this.findOne(tenantId, branchId, id); // ensures tenant+branch ownership before mutating
    // A renewal (expiresAt pushed forward) starts a fresh reminder cycle —
    // otherwise the member would never get reminded again next time they're due.
    if (data.expiresAt && new Date(data.expiresAt).getTime() !== existing.expiresAt.getTime()) {
      data.feeReminderSentAt = null;
    }
    const member = await this.prisma.member.update({ where: { id }, data });
    if (member.phone && !existing.user) {
      await this.createLoginIfMissing(tenantId, existing.branchId, member.id, member.name, member.phone);
    }
    return this.findOne(tenantId, branchId, id);
  }

  async resetLoginPassword(tenantId: string, branchId: string, memberId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const member = await this.prisma.member.findFirst({
      where: { id: memberId, tenantId, branchId },
      include: { user: true },
    });
    if (!member) throw new NotFoundException('Member not found');
    if (!member.user) throw new BadRequestException('This member does not have a login yet');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: member.user.id }, data: { password: hashed } });
    return { success: true };
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

  // Bulk-onboard old/existing students from an Excel/CSV file an owner
  // already keeps their records in — one row per student, no Aadhar upload
  // (that's only enforced on the public self-service booking flow).
  async importFromSpreadsheet(tenantId: string, branchId: string, buffer: Buffer) {
    // cellDates: true — otherwise a real date cell comes through as a raw
    // Excel serial number (e.g. 46037), which strings straight into
    // `new Date("46037")` and V8 reads as the literal year 46037.
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const firstSheet = workbook.SheetNames[0];
    if (!firstSheet) throw new BadRequestException('Spreadsheet has no sheets');

    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(workbook.Sheets[firstSheet], {
      defval: '',
    });
    if (rows.length === 0) throw new BadRequestException('Spreadsheet has no rows');

    const errors: { row: number; reason: string }[] = [];
    let created = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2; // +1 for header row, +1 for 1-indexing
      const raw = rows[i];
      const normalizedRow: Record<string, any> = {};
      for (const k of Object.keys(raw)) normalizedRow[k.trim().toLowerCase()] = raw[k];

      // Column headers matched case/space-insensitively so a human-typed
      // Excel sheet ("Phone Number", "phone", "PHONE") all just work.
      const get = (...keys: string[]) => {
        for (const key of keys) {
          const v = normalizedRow[key];
          if (v !== undefined && v !== '') return String(v).trim();
        }
        return '';
      };

      const name = get('name', 'student name', 'full name');
      const phone = get('phone', 'phone number', 'mobile');
      const planRaw = get('plan').toUpperCase();
      const batch = get('batch', 'batch/shift', 'shift');
      const goalTag = get('goal', 'goal tag', 'goaltag') || undefined;
      const joinedCell =
        normalizedRow['joined'] ?? normalizedRow['joined date'] ?? normalizedRow['joinedat'] ?? normalizedRow['join date'];

      if (!name) {
        errors.push({ row: rowNumber, reason: 'Missing name' });
        continue;
      }
      if (!phone || !PHONE_PATTERN.test(phone)) {
        errors.push({ row: rowNumber, reason: 'Missing/invalid phone number' });
        continue;
      }
      const plan = PLAN_ALIASES[planRaw];
      if (!plan) {
        errors.push({ row: rowNumber, reason: `Plan must be Monthly, Quarterly or Daily Pass (got "${planRaw}")` });
        continue;
      }
      if (!batch) {
        errors.push({ row: rowNumber, reason: 'Missing batch' });
        continue;
      }

      let joinedAt: string | undefined;
      if (joinedCell instanceof Date) {
        if (!isNaN(joinedCell.getTime())) joinedAt = joinedCell.toISOString();
      } else if (joinedCell) {
        const parsed = new Date(String(joinedCell).trim());
        if (!isNaN(parsed.getTime())) joinedAt = parsed.toISOString();
      }

      try {
        await this.create(tenantId, branchId, { name, phone, goalTag, plan, batch, joinedAt });
        created++;
      } catch (err: any) {
        errors.push({ row: rowNumber, reason: err.message || 'Could not create this student' });
      }
    }

    return { created, failed: errors.length, errors };
  }

  async remove(tenantId: string, branchId: string, id: string) {
    await this.findOne(tenantId, branchId, id); // ensures tenant+branch ownership before mutating

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
