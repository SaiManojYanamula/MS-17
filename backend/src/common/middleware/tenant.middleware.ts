import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export interface TenantRequest extends Request {
  tenantId?: string;
  branchId?: string;
  userId?: string;
  role?: string;
  memberId?: string;
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
  use(req: TenantRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing auth token');
    }

    const token = authHeader.replace('Bearer ', '');

    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
        sub: string;
        tenantId: string;
        branchId?: string;
        role: string;
        memberId?: string;
      };

      req.userId = payload.sub;
      req.tenantId = payload.tenantId;
      req.branchId = payload.branchId;
      req.role = payload.role;
      req.memberId = payload.memberId;

      next();
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
