import { Body, Controller, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { SeatingService } from './seating.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('seating')
export class SeatingController {
  constructor(private seatingService: SeatingService) {}

  @Get()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  getSeatMap(@Req() req: TenantRequest, @Query('branchId') branchId?: string) {
    return this.seatingService.getSeatMap(req.tenantId!, branchId ?? req.branchId!);
  }

  @Post('zones')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER')
  createZone(
    @Req() req: TenantRequest,
    @Body() body: { name: string; startSeat: number; endSeat: number },
  ) {
    return this.seatingService.createZone(req.tenantId!, req.branchId!, body);
  }

  @Get(':seatId')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  getSeatDetail(@Req() req: TenantRequest, @Param('seatId') seatId: string) {
    return this.seatingService.getSeatDetail(req.tenantId!, seatId);
  }

  @Patch(':seatId/assign')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  assignSeat(
    @Req() req: TenantRequest,
    @Param('seatId') seatId: string,
    @Body('memberId') memberId: string,
  ) {
    return this.seatingService.assignSeat(req.tenantId!, seatId, memberId);
  }

  @Patch(':seatId/release')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  releaseSeat(@Req() req: TenantRequest, @Param('seatId') seatId: string) {
    return this.seatingService.releaseSeat(req.tenantId!, seatId);
  }
}
