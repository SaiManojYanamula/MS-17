import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.expense.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async summary(tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [thisMonthAgg, totalAgg] = await Promise.all([
      this.prisma.expense.aggregate({
        where: { tenantId, createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.expense.aggregate({
        where: { tenantId },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      thisMonth: thisMonthAgg._sum.amount ?? 0,
      allTime: totalAgg._sum.amount ?? 0,
      count: totalAgg._count,
    };
  }

  async create(
    tenantId: string,
    branchId: string,
    data: { category: string; amount: number; note?: string; receiptUrl?: string },
  ) {
    return this.prisma.expense.create({ data: { ...data, tenantId, branchId } });
  }
}
