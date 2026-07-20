import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { MembersService } from './members.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  findAll(
    @Req() req: TenantRequest,
    @Query('filter') filter?: 'active' | 'expiring' | 'expired',
    @Query('search') search?: string,
  ) {
    return this.membersService.findAll(req.tenantId!, filter, search);
  }

  // Student self-service — must come before ':id' or it'd be swallowed as an id param.
  @Get('me')
  findMine(@Req() req: TenantRequest) {
    if (!req.memberId) {
      throw new ForbiddenException('No member profile linked to this account');
    }
    return this.membersService.findOne(req.tenantId!, req.memberId);
  }

  @Get(':id')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  findOne(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.membersService.findOne(req.tenantId!, id);
  }

  @Post()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  create(@Req() req: TenantRequest, @Body() body: any) {
    return this.membersService.create(req.tenantId!, req.branchId!, body);
  }

  @Patch(':id')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  update(@Req() req: TenantRequest, @Param('id') id: string, @Body() body: any) {
    return this.membersService.update(req.tenantId!, id, body);
  }

  @Delete(':id')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER')
  remove(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.membersService.remove(req.tenantId!, id);
  }
}
