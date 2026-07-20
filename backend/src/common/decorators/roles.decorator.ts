import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

// Usage: @Roles('SUPER_ADMIN', 'TENANT_OWNER')
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
