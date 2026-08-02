import { BadRequestException, Injectable } from '@nestjs/common';
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
    branchAddress?: string;
    ownerName: string;
    ownerEmail: string;
    ownerPassword: string;
  }) {
    const existingSlug = await this.prisma.tenant.findUnique({ where: { slug: data.slug } });
    if (existingSlug) {
      throw new BadRequestException(`Slug '${data.slug}' is already in use`);
    }

    const tenant = await this.prisma.tenant.create({ data: { name: data.name, slug: data.slug } });
    const branch = await this.prisma.branch.create({
      data: { tenantId: tenant.id, name: data.branchName || 'Main Branch', address: data.branchAddress },
    });

    try {
      await this.authService.register({
        tenantId: tenant.id,
        branchId: branch.id,
        name: data.ownerName,
        email: data.ownerEmail,
        password: data.ownerPassword,
        role: 'TENANT_OWNER',
      });
    } catch (err) {
      // Owner account failed (e.g. duplicate email) — don't leave an orphaned org behind.
      await this.prisma.branch.delete({ where: { id: branch.id } });
      await this.prisma.tenant.delete({ where: { id: tenant.id } });
      throw err;
    }

    return this.prisma.tenant.findUnique({ where: { id: tenant.id }, include: { branches: true } });
  }

  async updateOrganization(
    id: string,
    data: {
      name?: string;
      plan?: string;
      status?: string;
      whatsappAccessEnabled?: boolean;
      enabledFeatures?: string[];
    },
  ) {
    const { enabledFeatures, ...rest } = data;
    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...rest,
        ...(enabledFeatures ? { enabledFeatures: enabledFeatures.join(',') } : {}),
      } as any,
    });
  }

  // Per-org WhatsApp message volume — each message costs the platform money
  // via the provider, so this is the usage/billing view for the super-admin.
  async getWhatsAppUsage() {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const [tenants, allTimeCounts, monthCounts] = await Promise.all([
      this.prisma.tenant.findMany({ select: { id: true, name: true, whatsappAccessEnabled: true } }),
      this.prisma.whatsAppMessageLog.groupBy({ by: ['tenantId'], _count: { id: true } }),
      this.prisma.whatsAppMessageLog.groupBy({
        by: ['tenantId'],
        _count: { id: true },
        where: { createdAt: { gte: monthStart } },
      }),
    ]);

    const allTimeMap = new Map(allTimeCounts.map((c) => [c.tenantId, c._count.id]));
    const monthMap = new Map(monthCounts.map((c) => [c.tenantId, c._count.id]));

    return tenants.map((t) => ({
      tenantId: t.id,
      name: t.name,
      whatsappAccessEnabled: t.whatsappAccessEnabled,
      messagesThisMonth: monthMap.get(t.id) ?? 0,
      messagesAllTime: allTimeMap.get(t.id) ?? 0,
    }));
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
    branchIds?: string[];
    name: string;
    email: string;
    password: string;
    role: string;
  }) {
    return this.authService.register({
      ...data,
      branchId: data.branchId ?? data.branchIds?.[0],
    });
  }

  async updateUser(id: string, data: { role?: string; isActive?: boolean }) {
    return this.prisma.user.update({ where: { id }, data: data as any });
  }

  // "Forgot password" escalation path — a tenant owner (or anyone else)
  // locked out gets reset by the platform super-admin.
  async resetUserPassword(id: string, password: string) {
    return this.authService.resetPassword(id, password);
  }

  // Owner-submitted "forgot password" requests (see auth.service.ts's
  // requestPasswordReset) — the super-admin looks up the matching account
  // in Users and resets it directly, then marks the request resolved.
  async listPasswordResetRequests() {
    return this.prisma.passwordResetRequest.findMany({
      where: { status: 'OPEN' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async resolvePasswordResetRequest(id: string) {
    return this.prisma.passwordResetRequest.update({ where: { id }, data: { status: 'RESOLVED' } });
  }
}
