import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// Start of the member's *current* billing cycle, derived by walking back
// one plan-length from their expiry — there's no separate "cycle start"
// field, so this is how we know which past payments count toward this
// cycle's fee (e.g. an advance paid at booking + the remainder paid on
// joining day should both count, but a payment from a prior renewal shouldn't).
//
// Walking back from expiresAt directly breaks on an *early* renewal:
// renewing before the old expiry extends from that old expiry (not from
// today), so the new expiry can be more than one plan-length in the future.
// Walking straight back from it then lands the cycle start in the future
// too, excluding the renewal payment that was just made. Clamping the
// reference point to "now" (whichever is earlier) keeps the window
// anchored to the cycle that's actually in progress.
function cycleStart(plan: string, expiresAt: Date, now: Date): Date {
  const reference = expiresAt.getTime() < now.getTime() ? expiresAt : now;
  const d = new Date(reference);
  if (plan === 'MONTHLY') d.setMonth(d.getMonth() - 1);
  else if (plan === 'QUARTERLY') d.setMonth(d.getMonth() - 3);
  else if (plan === 'YEARLY') d.setMonth(d.getMonth() - 12);
  else d.setDate(d.getDate() - 1); // DAILY_PASS
  return d;
}

// What a payment actually still counts for toward "paid toward the fee" —
// a full PAID amount, ₹0 for a fully refunded one, or whatever portion
// wasn't refunded for a partial refund (amount - refundAmount).
function netPaid(p: { status: string; amount: number; refundAmount: number | null }): number {
  if (p.status === 'PAID') return p.amount;
  if (p.status === 'REFUNDED') return Math.max(p.amount - (p.refundAmount ?? p.amount), 0);
  return 0;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, branchId: string, status?: 'PAID' | 'PENDING' | 'REFUNDED') {
    const now = new Date();
    const [payments, tenant] = await Promise.all([
      this.prisma.payment.findMany({
        where: { tenantId, branchId, ...(status ? { status } : {}) },
        include: { member: { include: { seat: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { monthlyFee: true, quarterlyFee: true, yearlyFee: true, dailyPassFee: true },
      }),
    ]);

    const feeByPlan: Record<string, number | null | undefined> = {
      MONTHLY: tenant?.monthlyFee,
      QUARTERLY: tenant?.quarterlyFee,
      YEARLY: tenant?.yearlyFee,
      DAILY_PASS: tenant?.dailyPassFee,
    };

    // A student can pay in installments (e.g. an advance to book the seat,
    // then the rest on joining day) — Due has to be the *cumulative*
    // shortfall for the member's current cycle, not just this one
    // transaction, or a second installment would wrongly look like a fresh
    // ₹0-paid charge instead of closing out the balance. REFUNDED rows are
    // included too (not just PAID) so a partial refund only removes the
    // refunded portion from that total, not the whole original amount.
    const memberIds = [...new Set(payments.map((p) => p.memberId))];
    const allPaidForMembers = memberIds.length
      ? await this.prisma.payment.findMany({
          where: { tenantId, memberId: { in: memberIds }, status: { in: ['PAID', 'REFUNDED'] } },
          select: { memberId: true, amount: true, refundAmount: true, status: true, createdAt: true },
        })
      : [];

    return payments.map((p) => {
      const fee = feeByPlan[p.member.plan];
      if (fee == null) return { ...p, fee: null, due: null, extra: null };

      const start = cycleStart(p.member.plan, p.member.expiresAt, now);
      const totalPaid = allPaidForMembers
        .filter((x) => x.memberId === p.memberId && x.createdAt >= start)
        .reduce((sum, x) => sum + netPaid(x), 0);

      return {
        ...p,
        fee,
        due: Math.max(fee - totalPaid, 0),
        extra: Math.max(totalPaid - fee, 0),
      };
    });
  }

  // Shared by summary() (sums the due) and pendingMembers() (lists who owes
  // it) — one member-level fee-vs-paid computation instead of duplicating
  // the cycle-window logic across both.
  private async computeDuePerMember(tenantId: string, branchId: string) {
    const now = new Date();
    const [members, tenant] = await Promise.all([
      this.prisma.member.findMany({
        where: { tenantId, branchId },
        include: { seat: true },
      }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { monthlyFee: true, quarterlyFee: true, yearlyFee: true, dailyPassFee: true },
      }),
    ]);
    if (!members.length) return [];

    const feeByPlan: Record<string, number | null | undefined> = {
      MONTHLY: tenant?.monthlyFee,
      QUARTERLY: tenant?.quarterlyFee,
      YEARLY: tenant?.yearlyFee,
      DAILY_PASS: tenant?.dailyPassFee,
    };

    const memberIds = members.map((m) => m.id);
    const allPaid = await this.prisma.payment.findMany({
      where: { tenantId, memberId: { in: memberIds }, status: { in: ['PAID', 'REFUNDED'] } },
      select: { memberId: true, amount: true, refundAmount: true, status: true, createdAt: true },
    });

    return members
      .map((member) => {
        const fee = feeByPlan[member.plan];
        if (fee == null) return null;
        const start = cycleStart(member.plan, member.expiresAt, now);
        const paid = allPaid
          .filter((x) => x.memberId === member.id && x.createdAt >= start)
          .reduce((sum, x) => sum + netPaid(x), 0);
        return { member, fee, paid, due: Math.max(fee - paid, 0) };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }

  async summary(tenantId: string, branchId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [collectedAgg, txCount, duePerMember] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { tenantId, branchId, status: 'PAID', createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({
        where: { tenantId, branchId, status: 'PAID', createdAt: { gte: monthStart } },
      }),
      this.computeDuePerMember(tenantId, branchId),
    ]);

    // "Pending Dues" has to reflect the same fee-vs-paid shortfall the
    // Payments table shows per member — no payment in this app is ever
    // actually created with status PENDING, so summing that status here
    // (the previous approach) always came out ₹0 regardless of what the
    // table showed.
    const pending = duePerMember.reduce((sum, x) => sum + x.due, 0);

    const collected = collectedAgg._sum.amount ?? 0;
    const avg = txCount > 0 ? Math.round(collected / txCount) : 0;

    return {
      collectedThisMonth: collected,
      pendingDues: pending,
      transactions: txCount,
      avgTransaction: avg,
    };
  }

  // Powers the Payments page's "Pending" tab — members who currently owe
  // money, not payment transactions (nothing in this app ever creates a
  // Payment row with status PENDING, so filtering payments by that status
  // was always an empty list regardless of what members actually owed).
  async pendingMembers(tenantId: string, branchId: string) {
    const duePerMember = await this.computeDuePerMember(tenantId, branchId);
    return duePerMember
      .filter((x) => x.due > 0)
      .map((x) => ({
        memberId: x.member.id,
        name: x.member.name,
        phone: x.member.phone,
        plan: x.member.plan,
        seat: x.member.seat,
        fee: x.fee,
        paid: x.paid,
        due: x.due,
      }))
      .sort((a, b) => b.due - a.due);
  }

  async create(tenantId: string, branchId: string, data: any) {
    return this.prisma.payment.create({ data: { ...data, tenantId, branchId } });
  }

  async refund(tenantId: string, branchId: string, id: string, refundAmount?: number) {
    const payment = await this.prisma.payment.findFirst({ where: { id, tenantId, branchId } });
    if (!payment) throw new NotFoundException('Payment not found');

    // Defaults to a full refund when no amount is given — but a partial
    // refund (e.g. prorated for unused days left on the plan) is just as
    // valid, as long as it doesn't exceed what was actually paid.
    const amount = refundAmount ?? payment.amount;
    if (!Number.isFinite(amount) || amount <= 0 || amount > payment.amount) {
      throw new BadRequestException(`Refund amount must be between ₹1 and ₹${payment.amount}`);
    }

    return this.prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED', refundAmount: amount },
    });
  }
}
