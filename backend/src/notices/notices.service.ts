import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class NoticesService {
  constructor(private prisma: PrismaService) {}

  async findAll(tenantId: string) {
    return this.prisma.notice.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    tenantId: string,
    branchId: string,
    data: { title: string; body: string; startDate?: string; endDate?: string },
  ) {
    if ((data.startDate && !data.endDate) || (data.endDate && !data.startDate)) {
      throw new BadRequestException('Provide both a start and end date, or neither');
    }
    return this.prisma.notice.create({
      data: {
        title: data.title,
        body: data.body,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        tenantId,
        branchId,
      },
    });
  }

  async update(
    tenantId: string,
    id: string,
    data: { title?: string; body?: string; startDate?: string; endDate?: string },
  ) {
    const existing = await this.prisma.notice.findFirst({ where: { id, tenantId } });
    if (!existing) throw new NotFoundException('Notice not found');

    // Empty string means "clear this date"; undefined means "leave as-is".
    const startDate = data.startDate !== undefined ? (data.startDate ? new Date(data.startDate) : null) : undefined;
    const endDate = data.endDate !== undefined ? (data.endDate ? new Date(data.endDate) : null) : undefined;

    const nextStart = startDate !== undefined ? startDate : existing.startDate;
    const nextEnd = endDate !== undefined ? endDate : existing.endDate;
    if ((nextStart && !nextEnd) || (nextEnd && !nextStart)) {
      throw new BadRequestException('Provide both a start and end date, or neither');
    }

    return this.prisma.notice.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.body !== undefined ? { body: data.body } : {}),
        ...(startDate !== undefined ? { startDate } : {}),
        ...(endDate !== undefined ? { endDate } : {}),
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.prisma.notice.deleteMany({ where: { id, tenantId } });
    return { success: true };
  }
}
