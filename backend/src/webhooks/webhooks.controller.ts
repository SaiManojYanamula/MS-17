import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma.service';

const GREETINGS = ['hi', 'hello', 'hey', 'start', 'namaste'];

// Unauthenticated — Meta calls these directly (see app.module.ts's
// TenantMiddleware exclude list). GET is the one-time handshake when you
// configure the webhook URL in Meta's dashboard; POST fires on every
// message/event on the connected WhatsApp number.
@Controller('webhooks/whatsapp')
export class WebhooksController {
  constructor(
    private notificationsService: NotificationsService,
    private prisma: PrismaService,
  ) {}

  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  @Post()
  async receive(@Body() body: any, @Res() res: Response) {
    // Ack immediately — Meta retries aggressively if we don't 200 fast, and
    // whatever we do with the message shouldn't hold up the response.
    res.status(200).send('EVENT_RECEIVED');

    try {
      const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
      if (!messages?.length) return;

      for (const msg of messages) {
        if (msg.type !== 'text') continue;
        const from = msg.from as string; // e.g. "918688440074", no leading +
        const text = (msg.text?.body || '').trim().toLowerCase();

        if (GREETINGS.includes(text)) {
          await this.replyWithBookingLink(from);
        }
      }
    } catch {
      // A malformed/unexpected payload should never crash the webhook.
    }
  }

  private async replyWithBookingLink(from: string) {
    const slug = process.env.WHATSAPP_DEFAULT_APPLY_SLUG;
    const baseUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3000';

    if (!slug) {
      await this.notificationsService.sendWhatsAppReply(
        from,
        "Thanks for reaching out! We'll share your booking link shortly.",
      );
      return;
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, name: true, whatsappAccessEnabled: true },
    });
    // Same billing gate as everywhere else — don't send on a tenant's behalf
    // unless the super-admin has granted them WhatsApp access.
    if (!tenant?.whatsappAccessEnabled) return;

    const link = `${baseUrl}/apply/${slug}`;
    await this.notificationsService.sendWhatsAppReply(
      from,
      `Welcome to ${tenant.name}! Book your seat here: ${link}`,
      tenant.id,
    );
  }
}
