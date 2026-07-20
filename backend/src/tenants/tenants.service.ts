import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async getMine(tenantId: string, branchId?: string) {
    const [tenant, branch] = await Promise.all([
      this.prisma.tenant.findUnique({ where: { id: tenantId } }),
      branchId ? this.prisma.branch.findFirst({ where: { id: branchId, tenantId } }) : null,
    ]);
    return { tenant, branch };
  }

  async updateTenant(tenantId: string, name: string) {
    return this.prisma.tenant.update({ where: { id: tenantId }, data: { name } });
  }

  async updateBranch(tenantId: string, branchId: string, data: { name?: string; address?: string }) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, tenantId } });
    if (!branch) throw new NotFoundException('Branch not found');
    return this.prisma.branch.update({ where: { id: branchId }, data });
  }

  async addBranch(tenantId: string, name: string, address?: string) {
    return this.prisma.branch.create({ data: { tenantId, name, address } });
  }

  async listBranches(tenantId: string) {
    return this.prisma.branch.findMany({ where: { tenantId } });
  }
}
