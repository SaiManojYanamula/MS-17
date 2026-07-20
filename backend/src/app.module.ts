import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
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
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
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
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // auth/register now requires an authenticated TENANT_OWNER (it's the
    // staff-invite flow) — only login and the public QR application form
    // stay open.
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'auth/login', method: RequestMethod.POST },
        { path: 'public/apply/:slug', method: RequestMethod.POST },
      )
      .forRoutes('*');
  }
}
