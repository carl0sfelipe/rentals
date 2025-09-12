import { Module } from '@nestjs/common';
import { CalendarSyncService } from './calendar-sync.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [
    PrismaService,
    { provide: 'PrismaService', useExisting: PrismaService },
    CalendarSyncService,
  ],
  exports: [CalendarSyncService],
})
export class CalendarModule {}
