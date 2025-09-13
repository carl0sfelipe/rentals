import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CalendarModule } from './calendar/calendar.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PropertiesModule } from './properties/properties.module';
import { BookingsModule } from './bookings/bookings.module';
import { PrismaModule } from './prisma/prisma.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ConfigController } from './config/config.controller';
import { OrganizationContextMiddleware } from './organizations/organization-context.middleware';
import { isMultiTenantEnabled, isOrganizationContextEnabled } from './config/feature-flags';

@Module({
  imports: [
    ScheduleModule.forRoot(), 
    PrismaModule, 
    ...(isMultiTenantEnabled() ? [OrganizationsModule] : []),
    CalendarModule, 
    AuthModule, 
    HealthModule, 
    PropertiesModule, 
    BookingsModule
  ],
  controllers: [AppController, ConfigController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    if (isOrganizationContextEnabled()) {
      consumer
        .apply(OrganizationContextMiddleware)
        .forRoutes('*'); // Apply to all routes only if multi-tenant is enabled
    }
  }
}
