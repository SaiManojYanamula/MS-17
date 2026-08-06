import { Injectable, NotFoundException } from '@nestjs/common';
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
    // ₹0-paid charge instead of closing out the balance.
    const memberIds = [...new Set(payments.map((p) => p.memberId))];
    const allPaidForMembers = memberIds.length
      ? await this.prisma.payment.findMany({
          where: { tenantId, memberId: { in: memberIds }, status: 'PAID' },
          select: { memberId: true, amount: true, createdAt: true },
        })
      : [];

    return payments.map((p) => {
      const fee = feeByPlan[p.member.plan];
      if (fee == null) return { ...p, due: null, extra: null };

      const start = cycleStart(p.member.plan, p.member.expiresAt, now);
      const totalPaid = allPaidForMembers
        .filter((x) => x.memberId === p.memberId && x.createdAt >= start)
        .reduce((sum, x) => sum + x.amount, 0);

      return {
        ...p,
        due: Math.max(fee - totalPaid, 0),
        extra: Math.max(totalPaid - fee, 0),
      };
    });
  }

  async summary(tenantId: string, branchId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [collectedAgg, txCount, tenant, members] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { tenantId, branchId, status: 'PAID', createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({
        where: { tenantId, branchId, status: 'PAID', createdAt: { gte: monthStart } },
      }),
      this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { monthlyFee: true, quarterlyFee: true, yearlyFee: true, dailyPassFee: true },
      }),
      this.prisma.member.findMany({
        where: { tenantId, branchId },
        select: { id: true, plan: true, expiresAt: true },
      }),
    ]);

    const feeByPlan: Record<string, number | null | undefined> = {
      MONTHLY: tenant?.monthlyFee,
      QUARTERLY: tenant?.quarterlyFee,
      YEARLY: tenant?.yearlyFee,
      DAILY_PASS: tenant?.dailyPassFee,
    };

    // "Pending Dues" has to reflect the same fee-vs-paid shortfall the
    // Payments table shows per member — no payment in this app is ever
    // actually created with status PENDING, so summing that status here
    // (the previous approach) always came out ₹0 regardless of what the
    // table showed.
    let pending = 0;
    if (members.length) {
      const memberIds = members.map((m) => m.id);
      const allPaid = await this.prisma.payment.findMany({
        where: { tenantId, memberId: { in: memberIds }, status: 'PAID' },
        select: { memberId: true, amount: true, createdAt: true },
      });
      for (const m of members) {
        const fee = feeByPlan[m.plan];
        if (fee == null) continue;
        const start = cycleStart(m.plan, m.expiresAt, now);
        const totalPaid = allPaid
          .filter((x) => x.memberId === m.id && x.createdAt >= start)
          .reduce((sum, x) => sum + x.amount, 0);
        pending += Math.max(fee - totalPaid, 0);
      }
    }

    const collected = collectedAgg._sum.amount ?? 0;
    const avg = txCount > 0 ? Math.round(collected / txCount) : 0;

    return {
      collectedThisMonth: collected,
      pendingDues: pending,
      transactions: txCount,
      avgTransaction: avg,
    };
  }

  async create(tenantId: string, branchId: string, data: any) {
    return this.prisma.payment.create({ data: { ...data, tenantId, branchId } });
  }

  async refund(tenantId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({ where: { id, tenantId } });
    if (!payment) throw new NotFoundException('Payment not found');

    return this.prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED' },
    });
  }
}
