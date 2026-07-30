import { Body, Controller, Get, Post, Req, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ExpensesService } from './expenses.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';
import { RequireFeature } from '../common/decorators/require-feature.decorator';

@Controller('expenses')
@Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
@RequireFeature('EXPENSES')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

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
      storage: diskStorage({
        destination: './uploads/expenses',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, unique);
        },
      }),
      fileFilter: (_req, file, cb) => {
        cb(null, /^image\/(jpeg|jpg|png)$|^application\/pdf$/.test(file.mimetype));
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  create(
    @Req() req: TenantRequest,
    @Body() body: { category: string; amount: string; note?: string },
    @UploadedFile() receipt?: Express.Multer.File,
  ) {
    const receiptUrl = receipt ? `/api/uploads/expenses/${receipt.filename}` : undefined;
    return this.expensesService.create(req.tenantId!, req.branchId!, {
      category: body.category,
      amount: Number(body.amount),
      note: body.note || undefined,
      receiptUrl,
    });
  }
}
