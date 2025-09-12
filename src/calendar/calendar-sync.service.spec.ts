import { describe, it, expect, beforeEach, vi } from 'vitest';
// Mover mock antes de importar o serviço para que seja aplicado corretamente
vi.mock('node-ical', () => {
  return {
    async: {
      fromURL: vi.fn(async () => ({
        'event-1': {
          type: 'VEVENT',
          uid: 'ev-1',
          start: new Date('2025-01-10T12:00:00Z'),
          end: new Date('2025-01-12T10:00:00Z'),
          summary: 'Reserva 1',
        },
        'event-2': {
          type: 'VEVENT',
          uid: 'ev-2',
          start: new Date('2025-02-01T15:00:00Z'),
          end: new Date('2025-02-05T11:00:00Z'),
          summary: 'Reserva 2',
        },
      })),
    },
  };
});
import { CalendarSyncService } from './calendar-sync.service';

// Mock de prisma em memória
const availabilities: any[] = [];
const prismaMock = {
  availability: {
    upsert: vi.fn(async ({ where, create, update }: any) => {
      const idx = availabilities.findIndex((a) => a.externalId === where.externalId);
      if (idx === -1) {
        const created = { id: String(availabilities.length + 1), ...create };
        availabilities.push(created);
        return created;
      }
      availabilities[idx] = { ...availabilities[idx], ...update };
      return availabilities[idx];
    }),
  },
};

describe('CalendarSyncService', () => {
  let service: CalendarSyncService;
  const propertyId = 'prop-123';
  const calendarUrl = 'https://example.com/ical.ics';

  beforeEach(() => {
    availabilities.length = 0;
    vi.clearAllMocks();
    service = new CalendarSyncService(prismaMock as any);
  });

  it('sincroniza eventos criando ou atualizando disponibilidades', async () => {
    const result = await service.syncForProperty({ propertyId, url: calendarUrl });

    expect(result).toEqual({ processed: 2 });
    expect(prismaMock.availability.upsert).toHaveBeenCalledTimes(2);

    const calls = (prismaMock.availability.upsert as any).mock.calls;
    const externalIds = calls.map((c: any) => c[0].where.externalId).sort();
    expect(externalIds).toEqual(['ev-1', 'ev-2']);

    const firstCallArgs = calls[0][0];
    expect(firstCallArgs.create.propertyId).toBe(propertyId);
    expect(new Date(firstCallArgs.create.start).toISOString()).toBe('2025-01-10T12:00:00.000Z');
    expect(new Date(firstCallArgs.create.end).toISOString()).toBe('2025-01-12T10:00:00.000Z');
  });
});
