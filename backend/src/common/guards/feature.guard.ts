import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FEATURE_KEY } from '../decorators/require-feature.decorator';
import { TenantRequest } from '../middleware/tenant.middleware';

@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredFeature = this.reflector.getAllAndOverride<string>(FEATURE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredFeature) return true; // route isn't gated behind an optional module

    const req = context.switchToHttp().getRequest<TenantRequest>();

    // Super Admin isn't scoped to a tenant, so module gating doesn't apply to them.
    if (req.role === 'SUPER_ADMIN') return true;

    if (!req.enabledFeatures?.includes(requiredFeature)) {
      throw new ForbiddenException(
        `This feature isn't enabled for your organization. Contact the platform admin.`,
      );
    }

    return true;
  }
}
