import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // Powers the Dashboard's 4 top stat cards + seating mini-grid + revenue widget
  async dashboardStats(tenantId: string) {
    const [activeMembers, totalSeats, occupiedSeats, pendingApplications, revenueThisMonth] =
      await Promise.all([
        this.prisma.member.count({ where: { tenantId, status: 'Active' } }),
        this.prisma.seat.count({ where: { tenantId } }),
        this.prisma.seat.count({ where: { tenantId, status: 'OCCUPIED' } }),
        this.prisma.application.count({ where: { tenantId, status: 'PENDING' } }),
        this.monthRevenue(tenantId, 0),
      ]);

    const lastMonthRevenue = await this.monthRevenue(tenantId, 1);
    const revenueChangePct = lastMonthRevenue
      ? Math.round(((revenueThisMonth - lastMonthRevenue) / lastMonthRevenue) * 100)
      : 0;

    return {
      activeMembers,
      seatsOccupied: occupiedSeats,
      seatsTotal: totalSeats,
      pendingApplications,
      revenueThisMonth,
      revenueChangePct,
    };
  }

  async recentActivity(tenantId: string, limit = 5) {
    const [payments, applications] = await Promise.all([
      this.prisma.payment.findMany({
        where: { tenantId },
        include: { member: true },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.application.findMany({
        where: { tenantId },
        orderBy: { appliedAt: 'desc' },
        take: limit,
      }),
    ]);

    const activity = [
      ...payments.map((p) => ({
        type: 'payment',
        text: `${p.member.name} paid ₹${p.amount} for ${p.label}`,
        at: p.createdAt,
      })),
      ...applications.map((a) => ({
        type: 'application',
        text: `New application from ${a.applicant} — ${a.batch} batch`,
        at: a.appliedAt,
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, limit);

    return activity;
  }

  // Revenue — last N months, matches "Revenue - Last 6 Months" bar chart
  async revenueTrend(tenantId: string, months = 6) {
    const results: { month: string; total: number }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const total = await this.monthRevenue(tenantId, i);
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      results.push({ month: d.toLocaleString('default', { month: 'short' }), total });
    }
    return results;
  }

  // Occupancy trend — last N weeks, matches "Occupancy Trend - Last 8 Weeks"
  async occupancyTrend(tenantId: string, weeks = 8) {
    const totalSeats = await this.prisma.seat.count({ where: { tenantId } });
    const results: { week: string; occupiedPct: number }[] = [];

    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - i * 7);

      // Members whose membership was active as of that week (joined before, expires after)
      const activeThatWeek = await this.prisma.member.count({
        where: { tenantId, joinedAt: { lte: weekEnd }, expiresAt: { gte: weekEnd } },
      });

      results.push({
        week: `W${weeks - i}`,
        occupiedPct: totalSeats > 0 ? Math.round((activeThatWeek / totalSeats) * 100) : 0,
      });
    }

    return results;
  }

  // Plan Distribution donut chart
  async planDistribution(tenantId: string) {
    const grouped = await this.prisma.member.groupBy({
      by: ['plan'],
      where: { tenantId },
      _count: { plan: true },
    });

    const total = grouped.reduce((sum, g) => sum + g._count.plan, 0);

    return grouped.map((g) => ({
      plan: g.plan,
      count: g._count.plan,
      pct: total > 0 ? Math.round((g._count.plan / total) * 100) : 0,
    }));
  }

  // Key Numbers panel
  async keyNumbers(tenantId: string) {
    const totalMembersAllTime = await this.prisma.member.count({ where: { tenantId } });

    const members = await this.prisma.member.findMany({
      where: { tenantId },
      select: { joinedAt: true, expiresAt: true, batch: true, goalTag: true },
    });

    const avgMembershipMonths =
      members.length > 0
        ? Math.round(
            (members.reduce(
              (sum, m) => sum + (m.expiresAt.getTime() - m.joinedAt.getTime()),
              0,
            ) /
              members.length /
              (1000 * 60 * 60 * 24 * 30)) *
              10,
          ) / 10
        : 0;

    const batchCounts: Record<string, number> = {};
    const goalCounts: Record<string, number> = {};
    for (const m of members) {
      batchCounts[m.batch] = (batchCounts[m.batch] ?? 0) + 1;
      if (m.goalTag) goalCounts[m.goalTag] = (goalCounts[m.goalTag] ?? 0) + 1;
    }

    const mostPopularBatch = Object.entries(batchCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';
    const mostCommonGoal = Object.entries(goalCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';

    const expiredCount = await this.prisma.member.count({
      where: { tenantId, status: 'Expired' },
    });
    const renewalRate = totalMembersAllTime > 0
      ? Math.round(((totalMembersAllTime - expiredCount) / totalMembersAllTime) * 100)
      : 0;

    return {
      totalMembersAllTime,
      avgMembershipMonths,
      renewalRate,
      mostPopularBatch,
      mostCommonGoal,
    };
  }

  private async monthRevenue(tenantId: string, monthsAgo: number) {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);

    const agg = await this.prisma.payment.aggregate({
      where: { tenantId, status: 'PAID', createdAt: { gte: start, lt: end } },
      _sum: { amount: true },
    });

    return agg._sum.amount ?? 0;
  }
}
