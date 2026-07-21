import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RequestsService {
  constructor(private prisma: PrismaService) {}

  async findMine(tenantId: string, memberId: string) {
    return this.prisma.request.findMany({
      where: { tenantId, memberId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.request.findMany({
      where: { tenantId },
      include: { member: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(
    tenantId: string,
    branchId: string,
    memberId: string,
    data: { type: string; message: string },
  ) {
    return this.prisma.request.create({
      data: { tenantId, branchId, memberId, type: data.type as any, message: data.message },
    });
  }

  async resolve(tenantId: string, id: string) {
    const request = await this.prisma.request.findFirst({ where: { id, tenantId } });
    if (!request) throw new NotFoundException('Request not found');

    return this.prisma.request.update({ where: { id }, data: { status: 'RESOLVED' } });
  }
}
