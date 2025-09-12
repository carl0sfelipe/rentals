import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

interface SyncParams {
  propertyId: string;
  url: string;
  horizonDays?: number;
}

interface ICalLikeEvent {
  type: string;
  uid: string;
  start: Date;
  end: Date;
  summary?: string;
}

// Tipagem parcial de prisma usada nos testes
interface AvailabilityUpsertArgs {
  where: { externalId: string };
  create: {
    externalId: string;
    propertyId: string;
    start: Date;
    end: Date;
    summary?: string;
    source: string;
  };
  update: {
    start: Date;
    end: Date;
    summary?: string;
    source: string;
  };
}

interface PrismaLike {
  availability: { upsert(args: AvailabilityUpsertArgs): Promise<any>; };
  property?: { findMany(args: any): Promise<Array<{ id: string }>> };
}

@Injectable()
export class CalendarSyncService {
  private readonly logger = new Logger(CalendarSyncService.name);
  constructor(@Inject('PrismaService') private readonly prisma: PrismaLike) {}

  async syncForProperty(params: SyncParams): Promise<{ processed: number }> {
    const { propertyId, url, horizonDays } = params;
    // Import dinâmico para facilitar mock
    const ical: any = await import('node-ical');
    const data: Record<string, ICalLikeEvent> = await ical.async.fromURL(url);

    const now = Date.now();
    const horizonMillis = horizonDays != null ? horizonDays * 24 * 60 * 60 * 1000 : null;

    const events = Object.values(data).filter((v: any) => v && v.type === 'VEVENT');

    let processed = 0;
    for (const ev of events) {
      if (!ev.start) continue; // ignora eventos inválidos
      const startDate = new Date(ev.start);
      if (horizonMillis != null && startDate.getTime() - now > horizonMillis) continue; // fora do horizonte
      const endDate = ev.end ? new Date(ev.end) : new Date(ev.start);
      await this.prisma.availability.upsert({
        where: { externalId: ev.uid },
        create: {
          externalId: ev.uid,
          propertyId,
          start: startDate,
          end: endDate,
          summary: ev.summary,
          source: 'ical',
        },
        update: {
          start: startDate,
          end: endDate,
          summary: ev.summary,
          source: 'ical',
        },
      });
      processed++;
    }

    return { processed };
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async scheduledSync() {
    // TODO: Implementar sync automático quando calendarUrl for adicionado ao schema
    this.logger.log('Auto-sync não disponível - campo calendarUrl não existe no schema');
    return;
  }
}
