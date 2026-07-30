import { ForbiddenException, Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma.service';

export interface TenantRequest extends Request {
  tenantId?: string;
  branchId?: string;
  userId?: string;
  role?: string;
  memberId?: string;
  enabledFeatures?: string[];
}

/**
 * Every incoming request (except auth routes) must carry a valid JWT.
 * We decode it once here and attach tenantId/branchId/role to the request
 * so every downstream service can filter Prisma queries by tenantId
 * without repeating auth logic. This is the enforcement point for the
 * shared-DB + tenantId multi-tenancy model.
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: TenantRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new UnauthorizedException('Missing auth token'));
    }

    const token = authHeader.replace('Bearer ', '');

    let payload: { sub: string; tenantId: string; branchId?: string; role: string; memberId?: string };
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET as string) as typeof payload;
    } catch {
      return next(new UnauthorizedException('Invalid or expired token'));
    }

    req.userId = payload.sub;
    req.tenantId = payload.tenantId;
    req.branchId = payload.branchId;
    req.role = payload.role;
    req.memberId = payload.memberId;

    // A JWT lives for 7 days, so a super-admin suspending an org (or toggling
    // a feature) mid-session must still take effect immediately rather than
    // waiting for token expiry.
    if (payload.tenantId && payload.role !== 'SUPER_ADMIN') {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: payload.tenantId },
        select: { status: true, enabledFeatures: true },
      });
      if (tenant?.status === 'SUSPENDED') {
        return next(new ForbiddenException('Your organization access has been suspended. Contact the platform admin.'));
      }
      req.enabledFeatures = tenant?.enabledFeatures ? tenant.enabledFeatures.split(',') : [];
    }

    // A client may ask to act against a different branch than the one baked
    // into their token — the multi-branch switcher. Only honor it if the
    // caller actually has access: TENANT_OWNER may switch to any branch in
    // their own org (ownership implies access to everything under it);
    // BRANCH_MANAGER/STAFF need an explicit UserBranchAccess grant.
    const requestedBranchId = req.header('x-branch-id');
    if (requestedBranchId && requestedBranchId !== req.branchId) {
      try {
        if (payload.role === 'TENANT_OWNER') {
          const branch = await this.prisma.branch.findFirst({
            where: { id: requestedBranchId, tenantId: payload.tenantId },
          });
          if (!branch) return next(new ForbiddenException('Branch not found in your organization'));
        } else if (payload.role === 'BRANCH_MANAGER' || payload.role === 'STAFF') {
          const access = await this.prisma.userBranchAccess.findUnique({
            where: { userId_branchId: { userId: payload.sub, branchId: requestedBranchId } },
          });
          if (!access) return next(new ForbiddenException('You do not have access to this branch'));
        } else {
          return next(new ForbiddenException('This role cannot switch branches'));
        }
        req.branchId = requestedBranchId;
      } catch (err) {
        return next(err);
      }
    }

    next();
  }
}
