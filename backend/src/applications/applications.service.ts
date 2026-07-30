import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string, branchId: string, status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.prisma.application.findMany({
      where: { tenantId, branchId, ...(status ? { status } : {}) },
      orderBy: { appliedAt: 'desc' },
    });
  }

  async pendingCount(tenantId: string, branchId: string) {
    return this.prisma.application.count({ where: { tenantId, branchId, status: 'PENDING' } });
  }

  async create(tenantId: string, branchId: string, data: any) {
    return this.prisma.application.create({
      data: { ...data, tenantId, branchId, status: 'PENDING' },
    });
  }

  // Approving an application converts it into a real Member record.
  // Seat assignment happens separately from the Seating module.
  async approve(tenantId: string, id: string) {
    const application = await this.prisma.application.findFirst({ where: { id, tenantId } });
    if (!application) throw new NotFoundException('Application not found');
    if (application.status !== 'PENDING') {
      throw new BadRequestException('Application already processed');
    }

    const expiresAt = this.computeExpiry(application.plan);

    const [, member] = await this.prisma.$transaction([
      this.prisma.application.update({ where: { id }, data: { status: 'APPROVED' } }),
      this.prisma.member.create({
        data: {
          tenantId,
          branchId: application.branchId,
          name: application.applicant,
          goalTag: application.goalTag,
          plan: application.plan,
          batch: application.batch,
          aadharUrl: application.aadharUrl,
          expiresAt,
          status: 'Active',
        },
      }),
    ]);

    return member;
  }

  async reject(tenantId: string, id: string) {
    const application = await this.prisma.application.findFirst({ where: { id, tenantId } });
    if (!application) throw new NotFoundException('Application not found');

    return this.prisma.application.update({ where: { id }, data: { status: 'REJECTED' } });
  }

  private computeExpiry(plan: string): Date {
    const now = new Date();
    if (plan === 'MONTHLY') return new Date(now.setMonth(now.getMonth() + 1));
    if (plan === 'QUARTERLY') return new Date(now.setMonth(now.getMonth() + 3));
    return new Date(now.setDate(now.getDate() + 1)); // DAILY_PASS
  }
}
