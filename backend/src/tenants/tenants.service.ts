import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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

  async updateTenant(
    tenantId: string,
    data: {
      name?: string;
      upiId?: string;
      upiPhone?: string;
      coverImageUrl?: string;
      notifyExpiry?: boolean;
      notifyPayments?: boolean;
      notifyWhatsapp?: boolean;
    },
  ) {
    // WhatsApp costs the platform money per message, so an owner can only
    // turn it on for their org once the super-admin has granted access —
    // enforced server-side, not just hidden in the UI.
    if (data.notifyWhatsapp) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { whatsappAccessEnabled: true },
      });
      if (!tenant?.whatsappAccessEnabled) {
        throw new BadRequestException(
          'WhatsApp notifications are not enabled for your organization yet — contact the platform admin.',
        );
      }
    }
    return this.prisma.tenant.update({ where: { id: tenantId }, data });
  }

  async updateBranch(tenantId: string, branchId: string, data: { name?: string; address?: string }) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, tenantId } });
    if (!branch) throw new NotFoundException('Branch not found');
    return this.prisma.branch.update({ where: { id: branchId }, data });
  }

  async addBranch(tenantId: string, name: string, address?: string) {
    return this.prisma.branch.create({ data: { tenantId, name, address } });
  }

  // TENANT_OWNER sees every branch in their org (ownership implies access to
  // all of it); BRANCH_MANAGER/STAFF only see their primary branch plus
  // whatever they were explicitly granted via UserBranchAccess.
  async listBranches(tenantId: string, role?: string, userId?: string, primaryBranchId?: string) {
    if (role === 'TENANT_OWNER') {
      return this.prisma.branch.findMany({ where: { tenantId } });
    }

    const access = userId
      ? await this.prisma.userBranchAccess.findMany({ where: { userId }, select: { branchId: true } })
      : [];
    const accessibleIds = new Set(access.map((a) => a.branchId));
    if (primaryBranchId) accessibleIds.add(primaryBranchId);

    if (accessibleIds.size === 0) return [];

    return this.prisma.branch.findMany({ where: { tenantId, id: { in: [...accessibleIds] } } });
  }

  // Staff/owner accounts for the "Admin & Staff Accounts" card in Settings —
  // students are managed separately via the Members page, not here.
  async listUsers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId, role: { not: 'STUDENT' } },
      select: { id: true, name: true, email: true, role: true, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // "Forgot password" for staff/owner — same reasoning as members.service.ts's
  // resetLoginPassword: no live email/SMS delivery yet, so another owner
  // resets it directly instead of a self-service link.
  async resetUserPassword(tenantId: string, userId: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const user = await this.prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) throw new NotFoundException('Account not found');

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { success: true };
  }
}
