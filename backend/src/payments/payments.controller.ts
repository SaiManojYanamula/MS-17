import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  findAll(@Req() req: TenantRequest, @Query('status') status?: 'PAID' | 'PENDING' | 'REFUNDED') {
    return this.paymentsService.findAll(req.tenantId!, req.branchId!, status);
  }

  @Get('summary')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  summary(@Req() req: TenantRequest) {
    return this.paymentsService.summary(req.tenantId!, req.branchId!);
  }

  @Post()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  create(@Req() req: TenantRequest, @Body() body: any) {
    return this.paymentsService.create(req.tenantId!, req.branchId!, body);
  }

  @Patch(':id/refund')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER')
  refund(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.paymentsService.refund(req.tenantId!, id);
  }
}
