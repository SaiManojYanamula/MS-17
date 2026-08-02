import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('super-admin')
@Roles('SUPER_ADMIN')
export class SuperAdminController {
  constructor(private superAdminService: SuperAdminService) {}

  @Get('organizations')
  listOrganizations() {
    return this.superAdminService.listOrganizations();
  }

  @Post('organizations')
  createOrganization(
    @Body()
    body: {
      name: string;
      slug: string;
      branchName?: string;
      branchAddress?: string;
      ownerName: string;
      ownerEmail: string;
      ownerPassword: string;
    },
  ) {
    return this.superAdminService.createOrganization(body);
  }

  @Patch('organizations/:id')
  updateOrganization(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      plan?: string;
      status?: string;
      whatsappAccessEnabled?: boolean;
      enabledFeatures?: string[];
    },
  ) {
    return this.superAdminService.updateOrganization(id, body);
  }

  @Get('whatsapp-usage')
  getWhatsAppUsage() {
    return this.superAdminService.getWhatsAppUsage();
  }

  @Get('branches')
  listBranches() {
    return this.superAdminService.listBranches();
  }

  @Post('branches')
  createBranch(@Body() body: { tenantId: string; name: string; address?: string }) {
    return this.superAdminService.createBranch(body);
  }

  @Patch('branches/:id')
  updateBranch(@Param('id') id: string, @Body() body: { name?: string; address?: string }) {
    return this.superAdminService.updateBranch(id, body);
  }

  @Get('users')
  listUsers() {
    return this.superAdminService.listUsers();
  }

  @Post('users')
  createUser(
    @Body()
    body: {
      tenantId: string;
      branchId?: string;
      branchIds?: string[];
      name: string;
      email: string;
      password: string;
      role: string;
    },
  ) {
    return this.superAdminService.createUser(body);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: { role?: string; isActive?: boolean }) {
    return this.superAdminService.updateUser(id, body);
  }

  @Patch('users/:id/reset-password')
  resetUserPassword(@Param('id') id: string, @Body('password') password: string) {
    return this.superAdminService.resetUserPassword(id, password);
  }

  @Get('password-reset-requests')
  listPasswordResetRequests() {
    return this.superAdminService.listPasswordResetRequests();
  }

  @Patch('password-reset-requests/:id/resolve')
  resolvePasswordResetRequest(@Param('id') id: string) {
    return this.superAdminService.resolvePasswordResetRequest(id);
  }
}
