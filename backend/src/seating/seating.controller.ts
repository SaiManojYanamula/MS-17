import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { SeatingService } from './seating.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/require-feature.decorator';

@Controller('seating')
@RequireFeature('SEATING')
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

  @Post('zones/:zoneId/seats')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER')
  addSeatsToZone(
    @Req() req: TenantRequest,
    @Param('zoneId') zoneId: string,
    @Body('count') count: number,
  ) {
    return this.seatingService.addSeatsToZone(req.tenantId!, req.branchId!, zoneId, Number(count));
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

  @Delete(':seatId')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER')
  deleteSeat(@Req() req: TenantRequest, @Param('seatId') seatId: string) {
    return this.seatingService.deleteSeat(req.tenantId!, seatId);
  }
}
