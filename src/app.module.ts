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
import { OrganizationContextMiddleware } from './organizations/organization-context.middleware';

@Module({
  imports: [
    ScheduleModule.forRoot(), 
    PrismaModule, 
    OrganizationsModule,
    CalendarModule, 
    AuthModule, 
    HealthModule, 
    PropertiesModule, 
    BookingsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(OrganizationContextMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
