import { Controller, Get, Query, Req } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/require-feature.decorator';

@Controller('reports')
@Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  // dashboard/recent-activity/new-members power the core Dashboard page,
  // which every tenant always has — only the dedicated Reports page (below)
  // is the optional, gateable module.
  @Get('dashboard')
  dashboard(@Req() req: TenantRequest) {
    return this.reportsService.dashboardStats(req.tenantId!, req.branchId!);
  }

  @Get('recent-activity')
  recentActivity(@Req() req: TenantRequest, @Query('limit') limit?: string) {
    return this.reportsService.recentActivity(req.tenantId!, req.branchId!, limit ? Number(limit) : 5);
  }

  @Get('new-members')
  newMembersThisWeek(@Req() req: TenantRequest, @Query('days') days?: string) {
    return this.reportsService.newMembersThisWeek(req.tenantId!, req.branchId!, days ? Number(days) : 7);
  }

  @Get('revenue-trend')
  @RequireFeature('REPORTS')
  revenueTrend(@Req() req: TenantRequest, @Query('months') months?: string) {
    return this.reportsService.revenueTrend(req.tenantId!, req.branchId!, months ? Number(months) : 6);
  }

  @Get('occupancy-trend')
  @RequireFeature('REPORTS')
  occupancyTrend(@Req() req: TenantRequest, @Query('weeks') weeks?: string) {
    return this.reportsService.occupancyTrend(req.tenantId!, req.branchId!, weeks ? Number(weeks) : 8);
  }

  @Get('plan-distribution')
  @RequireFeature('REPORTS')
  planDistribution(@Req() req: TenantRequest) {
    return this.reportsService.planDistribution(req.tenantId!, req.branchId!);
  }

  @Get('key-numbers')
  @RequireFeature('REPORTS')
  keyNumbers(@Req() req: TenantRequest) {
    return this.reportsService.keyNumbers(req.tenantId!, req.branchId!);
  }

  @Get('members-joined')
  @RequireFeature('REPORTS')
  membersJoinedInRange(@Req() req: TenantRequest, @Query('from') from: string, @Query('to') to: string) {
    return this.reportsService.membersJoinedInRange(
      req.tenantId!,
      req.branchId!,
      new Date(from),
      new Date(to),
    );
  }
}
