import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { TenantsService } from './tenants.service';
import { Roles } from '../common/decorators/roles.decorator';
import { TenantRequest } from '../common/middleware/tenant.middleware';

@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  // Settings page profile card — the caller's own tenant/branch.
  @Get('me')
  getMine(@Req() req: TenantRequest) {
    return this.tenantsService.getMine(req.tenantId!, req.branchId);
  }

  @Patch('me')
  @Roles('TENANT_OWNER')
  updateMine(
    @Req() req: TenantRequest,
    @Body()
    body: {
      name?: string;
      upiId?: string;
      upiPhone?: string;
      notifyExpiry?: boolean;
      notifyPayments?: boolean;
      notifyWhatsapp?: boolean;
    },
  ) {
    return this.tenantsService.updateTenant(req.tenantId!, body);
  }

  // Branding image shown behind the public QR/booking page.
  @Post('me/cover')
  @Roles('TENANT_OWNER')
  @UseInterceptors(
    FileInterceptor('cover', {
      storage: diskStorage({
        destination: './uploads/covers',
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
          cb(null, unique);
        },
      }),
      fileFilter: (_req, file, cb) => {
        cb(null, /^image\/(jpeg|jpg|png|webp)$/.test(file.mimetype));
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  uploadCover(@Req() req: TenantRequest, @UploadedFile() cover?: Express.Multer.File) {
    const coverImageUrl = cover ? `/api/uploads/covers/${cover.filename}` : undefined;
    return this.tenantsService.updateTenant(req.tenantId!, { coverImageUrl });
  }

  @Patch('branches/:id')
  @Roles('TENANT_OWNER')
  updateBranch(
    @Req() req: TenantRequest,
    @Param('id') id: string,
    @Body() body: { name?: string; address?: string },
  ) {
    return this.tenantsService.updateBranch(req.tenantId!, id, body);
  }

  @Post('branches')
  @Roles('TENANT_OWNER')
  addBranch(@Req() req: TenantRequest, @Body() body: { name: string; address?: string }) {
    return this.tenantsService.addBranch(req.tenantId!, body.name, body.address);
  }

  @Get('branches')
  listBranches(@Req() req: TenantRequest) {
    return this.tenantsService.listBranches(req.tenantId!, req.role, req.userId, req.branchId);
  }

  @Get('users')
  @Roles('TENANT_OWNER')
  listUsers(@Req() req: TenantRequest) {
    return this.tenantsService.listUsers(req.tenantId!);
  }

  // "Forgot password" for staff/owner accounts.
  @Patch('users/:id/reset-password')
  @Roles('TENANT_OWNER')
  resetUserPassword(
    @Req() req: TenantRequest,
    @Param('id') id: string,
    @Body('password') password: string,
  ) {
    return this.tenantsService.resetUserPassword(req.tenantId!, id, password);
  }
}
