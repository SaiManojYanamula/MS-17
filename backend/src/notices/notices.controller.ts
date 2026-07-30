import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { NoticesService } from './notices.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/require-feature.decorator';

@Controller('notices')
@RequireFeature('NOTICES')
export class NoticesController {
  constructor(private noticesService: NoticesService) {}

  // No @Roles — every authenticated tenant member (staff or student) can read notices.
  @Get()
  findAll(@Req() req: TenantRequest) {
    return this.noticesService.findAll(req.tenantId!);
  }

  @Post()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  create(@Req() req: TenantRequest, @Body() body: { title: string; body: string }) {
    return this.noticesService.create(req.tenantId!, req.branchId!, body);
  }

  @Delete(':id')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  remove(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.noticesService.remove(req.tenantId!, id);
  }
}
