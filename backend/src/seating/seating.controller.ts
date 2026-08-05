import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { SeatingService } from './seating.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { R2Service } from '../common/storage/r2.service';

const zoneImageUpload = FileInterceptor('image', {
  storage: memoryStorage(),
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller('seating')
@RequireFeature('SEATING')
export class SeatingController {
  constructor(
    private seatingService: SeatingService,
    private r2Service: R2Service,
  ) {}

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

  @Post('zones/:zoneId/image')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER')
  @UseInterceptors(zoneImageUpload)
  async uploadZoneImage(
    @Req() req: TenantRequest,
    @Param('zoneId') zoneId: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(image.originalname)}`;
    const imageUrl = await this.r2Service.upload(`zones/${unique}`, image.buffer, image.mimetype);
    return this.seatingService.updateZoneImage(req.tenantId!, req.branchId!, zoneId, imageUrl);
  }

  @Delete('zones/:zoneId/image')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER')
  deleteZoneImage(@Req() req: TenantRequest, @Param('zoneId') zoneId: string) {
    return this.seatingService.updateZoneImage(req.tenantId!, req.branchId!, zoneId, null);
  }

  @Delete('zones/:zoneId')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER')
  deleteZone(@Req() req: TenantRequest, @Param('zoneId') zoneId: string) {
    return this.seatingService.deleteZone(req.tenantId!, req.branchId!, zoneId);
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
