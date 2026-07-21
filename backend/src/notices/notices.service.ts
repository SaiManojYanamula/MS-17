import { Injectable } from '@nestjs/common';
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

  async create(tenantId: string, branchId: string, data: { title: string; body: string }) {
    return this.prisma.notice.create({ data: { ...data, tenantId, branchId } });
  }

  async remove(tenantId: string, id: string) {
    await this.prisma.notice.deleteMany({ where: { id, tenantId } });
    return { success: true };
  }
}
