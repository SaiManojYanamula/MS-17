import { Body, Controller, Get, Param, Patch, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { ExpensesService } from './expenses.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { R2Service } from '../common/storage/r2.service';

const receiptUpload = FileInterceptor('receipt', {
  storage: memoryStorage(),
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(jpeg|jpg|png)$|^application\/pdf$/.test(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller('expenses')
@Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
@RequireFeature('EXPENSES')
export class ExpensesController {
  constructor(
    private expensesService: ExpensesService,
    private r2Service: R2Service,
  ) {}

  @Get()
  findAll(@Req() req: TenantRequest) {
    return this.expensesService.findAll(req.tenantId!, req.branchId!);
  }

  @Get('summary')
  summary(@Req() req: TenantRequest) {
    return this.expensesService.summary(req.tenantId!, req.branchId!);
  }

  private async uploadReceipt(file?: Express.Multer.File): Promise<string | undefined> {
    if (!file) return undefined;
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    return this.r2Service.upload(`expenses/${unique}`, file.buffer, file.mimetype);
  }

  @Post()
  @UseInterceptors(receiptUpload)
  async create(
    @Req() req: TenantRequest,
    @Body() body: { category: string; amount: string; note?: string },
    @UploadedFile() receipt?: Express.Multer.File,
  ) {
    return this.expensesService.create(req.tenantId!, req.branchId!, {
      category: body.category,
      amount: Number(body.amount),
      note: body.note || undefined,
      receiptUrl: await this.uploadReceipt(receipt),
    });
  }

  @Patch(':id')
  @UseInterceptors(receiptUpload)
  async update(
    @Req() req: TenantRequest,
    @Param('id') id: string,
    @Body() body: { category?: string; amount?: string; note?: string },
    @UploadedFile() receipt?: Express.Multer.File,
  ) {
    const receiptUrl = await this.uploadReceipt(receipt);
    return this.expensesService.update(req.tenantId!, req.branchId!, id, {
      category: body.category,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      note: body.note,
      ...(receiptUrl ? { receiptUrl } : {}),
    });
  }
}
