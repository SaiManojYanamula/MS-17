import { Body, Controller, Get, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { ExpensesService } from './expenses.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/require-feature.decorator';
import { R2Service } from '../common/storage/r2.service';

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

  @Post()
  @UseInterceptors(
    FileInterceptor('receipt', {
      storage: memoryStorage(),
      fileFilter: (_req, file, cb) => {
        cb(null, /^image\/(jpeg|jpg|png)$|^application\/pdf$/.test(file.mimetype));
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @Req() req: TenantRequest,
    @Body() body: { category: string; amount: string; note?: string },
    @UploadedFile() receipt?: Express.Multer.File,
  ) {
    let receiptUrl: string | undefined;
    if (receipt) {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(receipt.originalname)}`;
      receiptUrl = await this.r2Service.upload(`expenses/${unique}`, receipt.buffer, receipt.mimetype);
    }
    return this.expensesService.create(req.tenantId!, req.branchId!, {
      category: body.category,
      amount: Number(body.amount),
      note: body.note || undefined,
      receiptUrl,
    });
  }
}
