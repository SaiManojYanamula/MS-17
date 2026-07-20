import { Controller, Get, Query, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reports')
@Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('dashboard')
  dashboard(@Req() req: TenantRequest) {
    return this.reportsService.dashboardStats(req.tenantId!);
  }

  @Get('recent-activity')
  recentActivity(@Req() req: TenantRequest, @Query('limit') limit?: string) {
    return this.reportsService.recentActivity(req.tenantId!, limit ? Number(limit) : 5);
  }

  @Get('revenue-trend')
  revenueTrend(@Req() req: TenantRequest, @Query('months') months?: string) {
    return this.reportsService.revenueTrend(req.tenantId!, months ? Number(months) : 6);
  }

  @Get('occupancy-trend')
  occupancyTrend(@Req() req: TenantRequest, @Query('weeks') weeks?: string) {
    return this.reportsService.occupancyTrend(req.tenantId!, weeks ? Number(weeks) : 8);
  }

  @Get('plan-distribution')
  planDistribution(@Req() req: TenantRequest) {
    return this.reportsService.planDistribution(req.tenantId!);
  }

  @Get('key-numbers')
  keyNumbers(@Req() req: TenantRequest) {
    return this.reportsService.keyNumbers(req.tenantId!);
  }
}
