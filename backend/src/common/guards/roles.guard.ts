import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { TenantRequest } from '../middleware/tenant.middleware';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // route has no role restriction
    }

    const req = context.switchToHttp().getRequest<TenantRequest>();

    if (!req.role || !requiredRoles.includes(req.role)) {
      throw new ForbiddenException(
        `Role '${req.role}' is not permitted to perform this action`,
      );
    }

    return true;
  }
}
