import {
  Body,
  ConflictException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { PrismaService } from '../prisma.service';
import { ApplicationsService } from '../applications/applications.service';
import { MembersService } from '../members/members.service';
import { NotificationsService } from '../notifications/notifications.service';
import { R2Service } from '../common/storage/r2.service';

const aadharUpload = FileInterceptor('aadharCard', {
  storage: memoryStorage(),
  fileFilter: (_req, file, cb) => {
    cb(null, /^image\/(jpeg|jpg|png)$|^application\/pdf$/.test(file.mimetype));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// The instant-booking form: an Aadhar card (image/PDF) plus an optional
// payment screenshot (image only — it's a screenshot, never a PDF).
const bookUpload = FileFieldsInterceptor(
  [
    { name: 'aadharCard', maxCount: 1 },
    { name: 'paymentScreenshot', maxCount: 1 },
  ],
  {
    storage: memoryStorage(),
    fileFilter: (_req, file, cb) => {
      if (file.fieldname === 'paymentScreenshot') {
        cb(null, /^image\/(jpeg|jpg|png)$/.test(file.mimetype));
      } else {
        cb(null, /^image\/(jpeg|jpg|png)$|^application\/pdf$/.test(file.mimetype));
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 },
  },
);

@Controller('public')
export class PublicController {
  constructor(
    private prisma: PrismaService,
    private applicationsService: ApplicationsService,
    private membersService: MembersService,
    private notificationsService: NotificationsService,
    private r2Service: R2Service,
  ) {}

  private async uploadAadhar(file?: Express.Multer.File): Promise<string | undefined> {
    if (!file) return undefined;
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    return this.r2Service.upload(`aadhar/${unique}`, file.buffer, file.mimetype);
  }

  private async uploadPaymentScreenshot(file?: Express.Multer.File): Promise<string | undefined> {
    if (!file) return undefined;
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`;
    return this.r2Service.upload(`payment-screenshots/${unique}`, file.buffer, file.mimetype);
  }

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
  @UseInterceptors(bookUpload)
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
    @UploadedFiles()
    files: { aadharCard?: Express.Multer.File[]; paymentScreenshot?: Express.Multer.File[] },
  ) {
    const aadharCard = files?.aadharCard?.[0];
    const paymentScreenshot = files?.paymentScreenshot?.[0];
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
      const aadharUrl = await this.uploadAadhar(aadharCard);

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
        const screenshotUrl = await this.uploadPaymentScreenshot(paymentScreenshot);
        await this.prisma.payment.create({
          data: {
            tenantId: tenant.id,
            branchId: branch.id,
            memberId: member.id,
            amount,
            method: (body.method as any) || 'UPI',
            status: 'PAID',
            label: `${body.plan} - Initial Payment`,
            screenshotUrl,
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

    const aadharUrl = await this.uploadAadhar(aadharCard);

    return this.applicationsService.create(tenant.id, branch.id, { ...body, aadharUrl });
  }
}
