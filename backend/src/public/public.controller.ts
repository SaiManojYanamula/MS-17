import { Body, Controller, NotFoundException, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PrismaService } from '../prisma.service';
import { ApplicationsService } from '../applications/applications.service';

@Controller('public')
export class PublicController {
  constructor(
    private prisma: PrismaService,
    private applicationsService: ApplicationsService,
  ) {}

  // Unauthenticated — reached by scanning the tenant's QR code. No login required.
  @Post('apply/:slug')
  @UseInterceptors(
    FileInterceptor('aadharCard', {
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
    }),
  )
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
