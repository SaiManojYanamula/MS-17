import { Body, Controller, ForbiddenException, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MembersService } from '../members/members.service';
import { TenantRequest } from '../common/middleware/tenant.middleware';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private membersService: MembersService,
  ) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  // Two things can happen here, with different authorization:
  // - creating a STUDENT login (linked to a memberId) — allowed for anyone
  //   who can manage members (TENANT_OWNER/BRANCH_MANAGER/STAFF).
  // - creating a staff/owner account — TENANT_OWNER only, unchanged.
  // The allowed roles depend on the request body, so this can't be expressed
  // with a single @Roles() decorator — checked manually instead.
  @Post('register')
  async register(
    @Req() req: TenantRequest,
    @Body()
    body: {
      branchId?: string;
      name: string;
      email: string;
      password: string;
      role: string;
      memberId?: string;
    },
  ) {
    if (body.role === 'STUDENT') {
      if (!body.memberId) {
        throw new ForbiddenException('memberId is required to create a student login');
      }
      if (!['TENANT_OWNER', 'BRANCH_MANAGER', 'STAFF'].includes(req.role!)) {
        throw new ForbiddenException(`Role '${req.role}' cannot create student logins`);
      }
      // Throws NotFoundException if the member doesn't exist or belongs to another tenant.
      await this.membersService.findOne(req.tenantId!, body.memberId);
    } else if (req.role !== 'TENANT_OWNER') {
      throw new ForbiddenException(`Role '${req.role}' is not permitted to perform this action`);
    }

    return this.authService.register({
      tenantId: req.tenantId!,
      branchId: body.branchId ?? req.branchId,
      name: body.name,
      email: body.email,
      password: body.password,
      role: body.role,
      memberId: body.memberId,
    });
  }
}
