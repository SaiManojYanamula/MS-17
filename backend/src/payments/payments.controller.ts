import { Body, Controller, Get, Param, Patch, Post, Query, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { PaymentsService } from './payments.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';
import { R2Service } from '../common/storage/r2.service';

const screenshotUpload = FileInterceptor('screenshot', {
  storage: memoryStorage(),
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(jpeg|jpg|png)$/.test(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private r2Service: R2Service,
  ) {}

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

  @Get('pending-members')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  pendingMembers(@Req() req: TenantRequest) {
    return this.paymentsService.pendingMembers(req.tenantId!, req.branchId!);
  }

  @Post()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  @UseInterceptors(screenshotUpload)
  async create(
    @Req() req: TenantRequest,
    @Body() body: { memberId: string; amount: string; method: string; label: string; status?: string },
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let screenshotUrl: string | undefined;
    if (file) {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      screenshotUrl = await this.r2Service.upload(`payment-screenshots/${unique}`, file.buffer, file.mimetype);
    }
    return this.paymentsService.create(req.tenantId!, req.branchId!, {
      memberId: body.memberId,
      amount: Number(body.amount),
      method: body.method,
      label: body.label,
      status: body.status || 'PAID',
      screenshotUrl,
    });
  }

  @Patch(':id/refund')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER')
  refund(@Req() req: TenantRequest, @Param('id') id: string, @Body('amount') amount?: number) {
    return this.paymentsService.refund(req.tenantId!, req.branchId!, id, amount != null ? Number(amount) : undefined);
  }
}
