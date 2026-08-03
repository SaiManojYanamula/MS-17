import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { RequestsService } from './requests.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { R2Service } from '../common/storage/r2.service';

const screenshotUpload = FileInterceptor('screenshot', {
  storage: memoryStorage(),
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(jpeg|jpg|png)$/.test(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller('requests')
@RequireFeature('REQUESTS')
export class RequestsController {
  constructor(
    private requestsService: RequestsService,
    private r2Service: R2Service,
  ) {}

  // Student self-service — no @Roles, resolved via the caller's own memberId.
  @Get('me')
  findMine(@Req() req: TenantRequest) {
    if (!req.memberId) {
      throw new ForbiddenException('No member profile linked to this account');
    }
    return this.requestsService.findMine(req.tenantId!, req.memberId);
  }

  // Student self-service — the free seats they can pick from for a
  // SEAT_CHANGE request, scoped to their own branch.
  @Get('available-seats')
  availableSeats(@Req() req: TenantRequest) {
    return this.requestsService.availableSeats(req.tenantId!, req.branchId!);
  }

  @Post()
  create(
    @Req() req: TenantRequest,
    @Body() body: { type: string; message: string; requestedSeatNumber?: number },
  ) {
    if (!req.memberId) {
      throw new ForbiddenException('No member profile linked to this account');
    }
    return this.requestsService.create(req.tenantId!, req.branchId!, req.memberId, body);
  }

  // Renewal-with-proof: same request type as create() but also carries a
  // payment amount + screenshot, so staff can verify and renew in one step.
  @Post('renewal')
  @UseInterceptors(screenshotUpload)
  async createRenewal(
    @Req() req: TenantRequest,
    @Body() body: { message?: string; amount: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!req.memberId) {
      throw new ForbiddenException('No member profile linked to this account');
    }
    let screenshotUrl: string | undefined;
    if (file) {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      screenshotUrl = await this.r2Service.upload(`payment-screenshots/${unique}`, file.buffer, file.mimetype);
    }
    return this.requestsService.create(req.tenantId!, req.branchId!, req.memberId, {
      type: 'RENEWAL',
      message: body.message || 'Membership renewal payment submitted',
      amount: Number(body.amount),
      screenshotUrl,
    });
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
