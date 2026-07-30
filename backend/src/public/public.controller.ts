import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PrismaService } from '../prisma.service';
import { ApplicationsService } from '../applications/applications.service';
import { MembersService } from '../members/members.service';
import { NotificationsService } from '../notifications/notifications.service';

const aadharUpload = FileInterceptor('aadharCard', {
  storage: diskStorage({
    destination: './uploads/aadhar',
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
      cb(null, unique);
    },
  }),
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(jpeg|jpg|png)$|^application\/pdf$/.test(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

@Controller('public')
export class PublicController {
  constructor(
    private prisma: PrismaService,
    private applicationsService: ApplicationsService,
    private membersService: MembersService,
    private notificationsService: NotificationsService,
  ) {}

  // Welcome screen + branch picker for the QR-code self-booking flow.
  @Get('tenant/:slug')
  async getTenant(@Param('slug') slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: {
        name: true,
        upiId: true,
        upiPhone: true,
        coverImageUrl: true,
        branches: { select: { id: true, name: true } },
      },
    });
    if (!tenant) throw new NotFoundException('Study hall not found');
    return tenant;
  }

  // Live seat availability for a branch, shown after the student picks it.
  @Get('seats/:slug/:branchId')
  async getAvailableSeats(@Param('slug') slug: string, @Param('branchId') branchId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Study hall not found');

    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, tenantId: tenant.id } });
    if (!branch) throw new NotFoundException('Branch not found');

    return this.prisma.seat.findMany({
      where: { branchId, tenantId: tenant.id, status: 'FREE' },
      select: { id: true, seatNumber: true, zoneId: true },
      orderBy: { seatNumber: 'asc' },
    });
  }

  // Self-service booking: student picks a free seat and pays right there —
  // becomes a Member immediately, no admin approval step. The seat is
  // claimed with a conditional update first so two students racing for the
  // same seat can't both win it.
  @Post('book')
  @UseInterceptors(aadharUpload)
  async book(
    @Body()
    body: {
      slug: string;
      branchId: string;
      seatId: string;
      name: string;
      phone: string;
      goalTag?: string;
      plan: string;
      batch: string;
      amount?: string;
      method?: string;
    },
    @UploadedFile() aadharCard?: Express.Multer.File,
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: body.slug } });
    if (!tenant) throw new NotFoundException('Study hall not found');

    const branch = await this.prisma.branch.findFirst({ where: { id: body.branchId, tenantId: tenant.id } });
    if (!branch) throw new NotFoundException('Branch not found');

    const claimed = await this.prisma.seat.updateMany({
      where: { id: body.seatId, branchId: branch.id, tenantId: tenant.id, status: 'FREE' },
      data: { status: 'OCCUPIED' },
    });
    if (claimed.count === 0) {
      throw new ConflictException('This seat was just taken by someone else — please pick another one');
    }

    try {
      const aadharUrl = aadharCard ? `/api/uploads/aadhar/${aadharCard.filename}` : undefined;

      const member = await this.membersService.create(tenant.id, branch.id, {
        name: body.name,
        phone: body.phone,
        goalTag: body.goalTag,
        plan: body.plan,
        batch: body.batch,
        aadharUrl,
      });

      await this.prisma.seat.update({ where: { id: body.seatId }, data: { memberId: member.id } });

      const amount = Number(body.amount);
      if (amount > 0) {
        await this.prisma.payment.create({
          data: {
            tenantId: tenant.id,
            branchId: branch.id,
            memberId: member.id,
            amount,
            method: (body.method as any) || 'UPI',
            status: 'PAID',
            label: `${body.plan} - Initial Payment`,
          },
        });
      }

      const seat = await this.prisma.seat.findUnique({ where: { id: body.seatId } });

      // Fire-and-forget — a notification hiccup should never fail the booking itself.
      this.notificationsService.notifyBookingConfirmed(tenant.id, body.phone, tenant.name, seat?.seatNumber);

      return { member, seatNumber: seat?.seatNumber };
    } catch (err) {
      // Member/payment creation failed after we'd already claimed the seat —
      // release it back rather than leaving a phantom-occupied seat.
      await this.prisma.seat
        .update({ where: { id: body.seatId }, data: { status: 'FREE' } })
        .catch(() => {});
      throw err;
    }
  }

  // Unauthenticated — the older "submit and wait for admin approval" flow.
  // Kept for now alongside the instant self-booking flow above.
  @Post('apply/:slug')
  @UseInterceptors(aadharUpload)
  async apply(
    @Param('slug') slug: string,
    @Body() body: { applicant: string; goalTag?: string; plan: string; batch: string },
    @UploadedFile() aadharCard?: Express.Multer.File,
  ) {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug } });
    if (!tenant) throw new NotFoundException('Study hall not found');

    const branch = await this.prisma.branch.findFirst({ where: { tenantId: tenant.id } });
    if (!branch) throw new NotFoundException('No branch configured for this study hall');

    const aadharUrl = aadharCard ? `/api/uploads/aadhar/${aadharCard.filename}` : undefined;

    return this.applicationsService.create(tenant.id, branch.id, { ...body, aadharUrl });
  }
}
