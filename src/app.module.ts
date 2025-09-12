import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { CalendarModule } from './calendar/calendar.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PropertiesModule } from './properties/properties.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ScheduleModule.forRoot(), CalendarModule, AuthModule, HealthModule, PropertiesModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
