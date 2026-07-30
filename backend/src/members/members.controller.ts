import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
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
import { MembersService } from './members.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('members')
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  findAll(
    @Req() req: TenantRequest,
    @Query('filter') filter?: 'active' | 'expiring' | 'expired',
    @Query('search') search?: string,
  ) {
    return this.membersService.findAll(req.tenantId!, req.branchId!, filter, search);
  }

  // Student self-service — must come before ':id' or it'd be swallowed as an id param.
  @Get('me')
  findMine(@Req() req: TenantRequest) {
    if (!req.memberId) {
      throw new ForbiddenException('No member profile linked to this account');
    }
    return this.membersService.findOne(req.tenantId!, req.memberId);
  }

  @Get(':id')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  findOne(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.membersService.findOne(req.tenantId!, id);
  }

  @Post()
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  create(@Req() req: TenantRequest, @Body() body: any) {
    return this.membersService.create(req.tenantId!, req.branchId!, body);
  }

  // Bulk-onboard old/existing students from an Excel/CSV file — for owners
  // switching over from a spreadsheet they already maintained by hand.
  @Post('import')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER')
  @UseInterceptors(FileInterceptor('file'))
  importMembers(@Req() req: TenantRequest, @UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return this.membersService.importFromSpreadsheet(req.tenantId!, req.branchId!, file.buffer);
  }

  @Patch(':id')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  update(@Req() req: TenantRequest, @Param('id') id: string, @Body() body: any) {
    return this.membersService.update(req.tenantId!, id, body);
  }

  @Delete(':id')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER')
  remove(@Req() req: TenantRequest, @Param('id') id: string) {
    return this.membersService.remove(req.tenantId!, id);
  }

  // "Forgot password" for students — there's no live SMS/email delivery yet,
  // so staff/owner reset it on the student's behalf instead of a self-service link.
  @Patch(':id/reset-password')
  @Roles('TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF')
  resetPassword(@Req() req: TenantRequest, @Param('id') id: string, @Body('password') password: string) {
    return this.membersService.resetLoginPassword(req.tenantId!, id, password);
  }
}
