import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, status?: 'PAID' | 'PENDING' | 'REFUNDED') {
    return this.prisma.payment.findMany({
      where: { tenantId, ...(status ? { status } : {}) },
      include: { member: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async summary(tenantId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [collectedAgg, pendingAgg, txCount] = await Promise.all([
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'PAID', createdAt: { gte: monthStart } },
        _sum: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { tenantId, status: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.payment.count({ where: { tenantId } }),
    ]);

    const collected = collectedAgg._sum.amount ?? 0;
    const pending = pendingAgg._sum.amount ?? 0;
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
    return this.prisma.payment.update({
      where: { id },
      data: { status: 'REFUNDED' },
    });
  }
}
