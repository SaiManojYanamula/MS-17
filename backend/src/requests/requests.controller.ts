import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { RequestsService } from './requests.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('requests')
export class RequestsController {
  constructor(private requestsService: RequestsService) {}

  // Student self-service — no @Roles, resolved via the caller's own memberId.
  @Get('me')
  findMine(@Req() req: TenantRequest) {
    if (!req.memberId) {
      throw new ForbiddenException('No member profile linked to this account');
    }
    return this.requestsService.findMine(req.tenantId!, req.memberId);
  }

  @Post()
  create(@Req() req: TenantRequest, @Body() body: { type: string; message: string }) {
    if (!req.memberId) {
      throw new ForbiddenException('No member profile linked to this account');
    }
    return this.requestsService.create(req.tenantId!, req.branchId!, req.memberId, body);
  }

  @Get()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  findAll(@Req() req: TenantRequest) {
    return this.requestsService.findAll(req.tenantId!);
  }

  @Patch(':id/resolve')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  resolve(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.requestsService.resolve(req.tenantId!, id);
  }
}
