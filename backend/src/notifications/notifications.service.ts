import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

// Provider-agnostic SMS/WhatsApp sending. Nothing actually goes out until
// the matching env vars are set — until then every call just logs what
// *would* have been sent, so the rest of the app can call this safely
// without caring whether a provider is configured yet.
//
// To go live:
//   SMS       — sign up with an India DLT-registered gateway (MSG91, Twilio,
//               Fast2SMS, ...), set SMS_API_KEY (+ SMS_SENDER_ID if the
//               provider needs one), and fill in the fetch() call below.
//   WhatsApp  — sign up for the WhatsApp Business API (Meta directly,
//               Gupshup, Twilio, ...), set WHATSAPP_API_KEY (+
//               WHATSAPP_PHONE_ID if required), and fill in the fetch()
//               call below.
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private prisma: PrismaService) {}

  private get smsConfigured() {
    return !!process.env.SMS_API_KEY;
  }

  private get whatsappConfigured() {
    return !!process.env.WHATSAPP_API_KEY && !!process.env.WHATSAPP_PHONE_ID;
  }

  // Members' phones are stored as plain 10-digit Indian numbers; Meta's API
  // needs the country code with no leading + or 0.
  private toWhatsAppNumber(phone: string) {
    const digits = phone.replace(/\D/g, '');
    return digits.length === 10 ? `91${digits}` : digits.replace(/^0+/, '');
  }

  // Every attempt gets logged (sent or failed) — this is the raw data behind
  // the super-admin's per-org usage view, since each message costs the
  // platform money via the WhatsApp provider.
  private logWhatsAppUsage(
    tenantId: string | undefined,
    phone: string,
    direction: 'outbound' | 'reply',
    status: 'sent' | 'failed',
  ) {
    if (!tenantId) return;
    this.prisma.whatsAppMessageLog
      .create({ data: { tenantId, phone, direction, status } })
      .catch(() => {});
  }

  async sendSms(phone: string, message: string): Promise<{ sent: boolean; reason?: string }> {
    if (!this.smsConfigured) {
      this.logger.log(`[SMS not configured] would send to ${phone}: ${message}`);
      return { sent: false, reason: 'SMS_API_KEY not set' };
    }

    try {
      // TODO: replace with your provider's actual API call, e.g. MSG91:
      // await fetch('https://api.msg91.com/api/v5/flow/', {
      //   method: 'POST',
      //   headers: { authkey: process.env.SMS_API_KEY!, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ mobiles: phone, ... }),
      // });
      this.logger.warn(`SMS_API_KEY is set but no provider call is wired up yet for ${phone}`);
      return { sent: false, reason: 'Provider call not implemented' };
    } catch (err) {
      this.logger.error(`SMS send failed for ${phone}`, err as Error);
      return { sent: false, reason: 'Send failed' };
    }
  }

  // NOTE: WhatsApp Business API requires a pre-approved template for the
  // first message to someone (free-form text only works within a 24h window
  // after *they* message *you* first). Until real templates ("Fee Due",
  // "Payment Confirmation", etc.) are created and approved in Meta Business
  // Manager, this sends Meta's universal `hello_world` sample template as a
  // connectivity smoke test — `message` is logged for visibility but isn't
  // the actual WhatsApp content yet. Swap the template name/components below
  // once real templates are approved.
  async sendWhatsApp(
    phone: string,
    message: string,
    tenantId?: string,
  ): Promise<{ sent: boolean; reason?: string }> {
    if (!this.whatsappConfigured) {
      this.logger.log(`[WhatsApp not configured] would send to ${phone}: ${message}`);
      return { sent: false, reason: 'WHATSAPP_API_KEY not set' };
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: this.toWhatsAppNumber(phone),
            type: 'template',
            template: { name: 'hello_world', language: { code: 'en_US' } },
          }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`WhatsApp send failed for ${phone}: ${res.status} ${body}`);
        this.logWhatsAppUsage(tenantId, phone, 'outbound', 'failed');
        return { sent: false, reason: `Provider error ${res.status}` };
      }

      this.logger.log(`WhatsApp sent to ${phone} (intended message: ${message})`);
      this.logWhatsAppUsage(tenantId, phone, 'outbound', 'sent');
      return { sent: true };
    } catch (err) {
      this.logger.error(`WhatsApp send failed for ${phone}`, err as Error);
      this.logWhatsAppUsage(tenantId, phone, 'outbound', 'failed');
      return { sent: false, reason: 'Send failed' };
    }
  }

  // Free-form text reply — only valid within 24h of the *recipient* messaging
  // us first (WhatsApp's "customer service window"). No template needed here
  // since this is a reply, not a business-initiated message.
  async sendWhatsAppReply(
    phone: string,
    message: string,
    tenantId?: string,
  ): Promise<{ sent: boolean; reason?: string }> {
    if (!this.whatsappConfigured) {
      this.logger.log(`[WhatsApp not configured] would reply to ${phone}: ${message}`);
      return { sent: false, reason: 'WHATSAPP_API_KEY not set' };
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: this.toWhatsAppNumber(phone),
            type: 'text',
            text: { body: message },
          }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        this.logger.error(`WhatsApp reply failed for ${phone}: ${res.status} ${body}`);
        this.logWhatsAppUsage(tenantId, phone, 'reply', 'failed');
        return { sent: false, reason: `Provider error ${res.status}` };
      }

      this.logger.log(`WhatsApp reply sent to ${phone}: ${message}`);
      this.logWhatsAppUsage(tenantId, phone, 'reply', 'sent');
      return { sent: true };
    } catch (err) {
      this.logger.error(`WhatsApp reply failed for ${phone}`, err as Error);
      this.logWhatsAppUsage(tenantId, phone, 'reply', 'failed');
      return { sent: false, reason: 'Send failed' };
    }
  }

  // Fire-and-forget on both channels — booking confirmation should never
  // fail or slow down because a notification provider hiccuped. Respects the
  // tenant's own notification preferences (Settings page): payments/booking
  // alerts can be turned off entirely, and WhatsApp is an opt-in channel on
  // top of SMS.
  async notifyBookingConfirmed(tenantId: string, phone: string, tenantName: string, seatNumber?: number) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { notifyPayments: true, notifyWhatsapp: true, whatsappAccessEnabled: true },
    });
    if (!tenant?.notifyPayments) return;

    const message = seatNumber
      ? `Welcome to ${tenantName}! Your seat #${seatNumber} is confirmed. Login with this phone number anytime to view your membership.`
      : `Welcome to ${tenantName}! Your seat is confirmed.`;

    this.sendSms(phone, message).catch(() => {});
    // Defense in depth — the write-time gate in tenants.service.ts should
    // already prevent notifyWhatsapp from being true without this, but never
    // trust a stored flag alone for something that costs real money.
    if (tenant.notifyWhatsapp && tenant.whatsappAccessEnabled) {
      this.sendWhatsApp(phone, message, tenantId).catch(() => {});
    }
  }
}
