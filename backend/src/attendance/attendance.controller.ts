import { Body, Controller, ForbiddenException, Get, Post, Query, Req } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('attendance')
export class AttendanceController {
  constructor(private attendanceService: AttendanceService) {}

  // Student self-service — no @Roles, resolved via the caller's own memberId.
  @Get('me')
  findMine(@Req() req: TenantRequest) {
    if (!req.memberId) {
      throw new ForbiddenException('No member profile linked to this account');
    }
    return this.attendanceService.findMine(req.tenantId!, req.memberId);
  }

  @Get()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  findForDate(@Req() req: TenantRequest, @Query('date') date: string) {
    return this.attendanceService.findForDate(req.tenantId!, date);
  }

  @Post()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  mark(@Req() req: TenantRequest, @Body() body: { memberId: string; date: string; status: string }) {
    return this.attendanceService.mark(req.tenantId!, req.branchId!, body.memberId, body.date, body.status);
  }
}
