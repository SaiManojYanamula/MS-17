import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantRequest } from '../common/middleware/tenant.middleware';

@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  // Settings page profile card — the caller's own tenant/branch.
  @Get('me')
  getMine(@Req() req: TenantRequest) {
    return this.tenantsService.getMine(req.tenantId!, req.branchId);
  }

  @Patch('me')
  @Roles('TENANT_OWNER')
  updateMine(@Req() req: TenantRequest, @Body() body: { name: string }) {
    return this.tenantsService.updateTenant(req.tenantId!, body.name);
  }

  @Patch('branches/:id')
  @Roles('TENANT_OWNER')
  updateBranch(
    @Req() req: TenantRequest,
    @Param('id') id: string,
    @Body() body: { name?: string; address?: string },
  ) {
    return this.tenantsService.updateBranch(req.tenantId!, id, body);
  }

  @Post('branches')
  @Roles('TENANT_OWNER')
  addBranch(@Req() req: TenantRequest, @Body() body: { name: string; address?: string }) {
    return this.tenantsService.addBranch(req.tenantId!, body.name, body.address);
  }

  @Get('branches')
  listBranches(@Req() req: TenantRequest) {
    return this.tenantsService.listBranches(req.tenantId!);
  }
}
