import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma.service';

const MIN_PASSWORD_LENGTH = 6;

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { tenant: { select: { status: true } } },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    // Super Admin's billing lever: a suspended org can't sign in at all,
    // regardless of whose credentials are correct.
    if (user.tenant?.status === 'SUSPENDED') {
      throw new UnauthorizedException(
        'Your organization access has been suspended. Contact the platform admin.',
      );
    }

    const token = jwt.sign(
      {
        sub: user.id,
        tenantId: user.tenantId,
        branchId: user.branchId ?? undefined,
        role: user.role,
        memberId: user.memberId ?? undefined,
        tokenVersion: user.tokenVersion,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' },
    );

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        branchId: user.branchId,
        memberId: user.memberId,
      },
    };
  }

  async register(data: {
    tenantId: string;
    branchId?: string;
    name: string;
    email: string;
    password: string;
    role: string;
    memberId?: string;
    // Extra branches (beyond the primary branchId) this user can switch
    // into — only meaningful for BRANCH_MANAGER/STAFF; TENANT_OWNER already
    // has implicit access to every branch in their org.
    branchIds?: string[];
  }) {
    if (!data.password || data.password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    let validBranchIds: string[] | undefined;
    if (data.branchIds?.length) {
      const branches = await this.prisma.branch.findMany({
        where: { id: { in: data.branchIds }, tenantId: data.tenantId },
        select: { id: true },
      });
      if (branches.length !== data.branchIds.length) {
        throw new BadRequestException('One or more branches do not belong to this organization');
      }
      validBranchIds = branches.map((b) => b.id);
    }

    const hashed = await bcrypt.hash(data.password, 10);

    try {
      const user = await this.prisma.user.create({
        data: {
          tenantId: data.tenantId,
          branchId: data.branchId,
          name: data.name,
          email: data.email,
          password: hashed,
          role: data.role as any,
          memberId: data.memberId,
        },
      });

      if (validBranchIds?.length) {
        await this.prisma.userBranchAccess.createMany({
          data: validBranchIds.map((branchId) => ({ userId: user.id, branchId })),
          skipDuplicates: true,
        });
      }

      const { password, ...safeUser } = user;
      return safeUser;
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new BadRequestException(`Email '${data.email}' is already in use`);
      }
      throw err;
    }
  }

  // Admin-initiated reset — there's no live email/SMS delivery yet, so
  // "forgot password" is handled by an owner/staff/super-admin resetting the
  // account on the user's behalf rather than a self-service email link.
  async resetPassword(userId: string, newPassword: string) {
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Account not found');

    const hashed = await bcrypt.hash(newPassword, 10);
    // Bumping tokenVersion invalidates every JWT already issued to this
    // user — otherwise a reset password wouldn't actually log anyone out,
    // since JWTs stay valid on their own for up to 7 days regardless.
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed, tokenVersion: { increment: 1 } },
    });
    return { success: true };
  }

  // Tenant owners have nobody above them in-app to reset their password —
  // this logs a request for the Super Admin to action manually (there's no
  // live email delivery to send a reset link through). Always returns the
  // same generic message regardless of whether the email exists, so this
  // can't be used to probe which emails are registered.
  async requestPasswordReset(email: string) {
    if (email) {
      await this.prisma.passwordResetRequest.create({ data: { email } });
    }
    return { success: true };
  }
}
