import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const token = jwt.sign(
      {
        sub: user.id,
        tenantId: user.tenantId,
        branchId: user.branchId ?? undefined,
        role: user.role,
        memberId: user.memberId ?? undefined,
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
  }) {
    const hashed = await bcrypt.hash(data.password, 10);

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

    const { password, ...safeUser } = user;
    return safeUser;
  }
}
