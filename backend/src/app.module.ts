import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { MembersModule } from './members/members.module';
import { SeatingModule } from './seating/seating.module';
import { ApplicationsModule } from './applications/applications.module';
import { PaymentsModule } from './payments/payments.module';
import { ReportsModule } from './reports/reports.module';
import { PublicModule } from './public/public.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { ExpensesModule } from './expenses/expenses.module';
import { AttendanceModule } from './attendance/attendance.module';
import { NoticesModule } from './notices/notices.module';
import { RequestsModule } from './requests/requests.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { BackupsModule } from './backups/backups.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { PrismaService } from './prisma.service';
import { StorageModule } from './common/storage/storage.module';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    ScheduleModule.forRoot(),
    StorageModule,
    AuthModule,
    TenantsModule,
    MembersModule,
    SeatingModule,
    ApplicationsModule,
    PaymentsModule,
    ReportsModule,
    PublicModule,
    SuperAdminModule,
    ExpensesModule,
    AttendanceModule,
    NoticesModule,
    RequestsModule,
    WebhooksModule,
    BackupsModule,
  ],
  providers: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // auth/register now requires an authenticated TENANT_OWNER (it's the
    // staff-invite flow) — only login, the public QR application/booking
    // routes, and Meta's WhatsApp webhook stay open.
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'health', method: RequestMethod.GET },
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'auth/forgot-password', method: RequestMethod.POST },
        { path: 'public/apply/:slug', method: RequestMethod.POST },
        { path: 'public/tenant/:slug', method: RequestMethod.GET },
        { path: 'public/seats/:slug/:branchId', method: RequestMethod.GET },
        { path: 'public/book', method: RequestMethod.POST },
        { path: 'webhooks/whatsapp', method: RequestMethod.GET },
        { path: 'webhooks/whatsapp', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
