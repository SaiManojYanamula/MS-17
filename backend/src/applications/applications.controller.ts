import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('applications')
export class ApplicationsController {
  constructor(private applicationsService: ApplicationsService) {}

  @Get()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  findAll(@Req() req: TenantRequest, @Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    return this.applicationsService.findAll(req.tenantId!, status);
  }

  @Get('pending-count')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  pendingCount(@Req() req: TenantRequest) {
    return this.applicationsService.pendingCount(req.tenantId!);
  }

  @Post()
  create(@Req() req: TenantRequest, @Body() body: any) {
    return this.applicationsService.create(req.tenantId!, req.branchId!, body);
  }

  @Patch(':id/approve')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  approve(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.applicationsService.approve(req.tenantId!, id);
  }

  @Patch(':id/reject')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  reject(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.applicationsService.reject(req.tenantId!, id);
  }
}
