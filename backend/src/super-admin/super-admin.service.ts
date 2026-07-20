import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  // Organizations (Tenants) — platform-wide, not scoped to a caller tenant
  async listOrganizations() {
    return this.prisma.tenant.findMany({
      include: { branches: true, _count: { select: { members: true, users: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrganization(data: {
    name: string;
    slug: string;
    branchName?: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
  }) {
    const tenant = await this.prisma.tenant.create({ data: { name: data.name, slug: data.slug } });
    const branch = await this.prisma.branch.create({
      data: { tenantId: tenant.id, name: data.branchName || 'Main Branch' },
    });
    await this.authService.register({
      tenantId: tenant.id,
      branchId: branch.id,
      name: data.ownerName,
      email: data.ownerEmail,
      password: data.ownerPassword,
      role: 'TENANT_OWNER',
    });
    return this.prisma.tenant.findUnique({ where: { id: tenant.id }, include: { branches: true } });
  }

  async updateOrganization(id: string, data: { name?: string; plan?: string; status?: string }) {
    return this.prisma.tenant.update({ where: { id }, data: data as any });
  }

  // Branches — cross-tenant
  async listBranches() {
    return this.prisma.branch.findMany({
      include: {
        tenant: { select: { id: true, name: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createBranch(data: { tenantId: string; name: string; address?: string }) {
    return this.prisma.branch.create({ data });
  }

  async updateBranch(id: string, data: { name?: string; address?: string }) {
    return this.prisma.branch.update({ where: { id }, data });
  }

  // Users — cross-tenant
  async listUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        tenant: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createUser(data: {
    tenantId: string;
    branchId?: string;
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    return this.authService.register(data);
  }

  async updateUser(id: string, data: { role?: string; isActive?: boolean }) {
    return this.prisma.user.update({ where: { id }, data: data as any });
  }
}
