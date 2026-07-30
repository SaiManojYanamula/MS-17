import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async findMine(tenantId: string, memberId: string) {
    return this.prisma.attendance.findMany({
      where: { tenantId, memberId },
      orderBy: { date: 'desc' },
    });
  }

  // Staff marking view — every active member in the tenant, with their
  // attendance status for the given date if it's already been marked.
  async findForDate(tenantId: string, branchId: string, date: string) {
    const [members, marked] = await Promise.all([
      this.prisma.member.findMany({
        where: { tenantId, branchId },
        select: { id: true, name: true, batch: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.attendance.findMany({ where: { tenantId, branchId, date: new Date(date) } }),
    ]);

    const statusByMember = new Map(marked.map((a) => [a.memberId, a.status]));
    return members.map((m) => ({ ...m, status: statusByMember.get(m.id) ?? null }));
  }

  async mark(tenantId: string, branchId: string, memberId: string, date: string, status: string) {
    const member = await this.prisma.member.findFirst({ where: { id: memberId, tenantId } });
    if (!member) throw new NotFoundException('Member not found');

    return this.prisma.attendance.upsert({
      where: { memberId_date: { memberId, date: new Date(date) } },
      create: { tenantId, branchId, memberId, date: new Date(date), status: status as any },
      update: { status: status as any },
    });
  }
}
