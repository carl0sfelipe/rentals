import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CalendarSyncService } from './calendar-sync.service';

// Mock node-ical BEFORE import usage inside service (dynamic import still resolves to this)
vi.mock('node-ical', () => ({
  async: {
    fromURL: vi.fn(async (url: string) => {
      if (url.includes('one')) {
        return {
          ev1: { type: 'VEVENT', uid: 'one-1', start: new Date('2025-03-01T10:00:00Z'), end: new Date('2025-03-02T10:00:00Z') },
        };
      }
      if (url.includes('three')) {
        return {
          evA: { type: 'VEVENT', uid: 'three-A', start: new Date('2025-04-05T12:00:00Z'), end: new Date('2025-04-06T08:00:00Z') },
          evB: { type: 'VEVENT', uid: 'three-B', start: new Date('2025-04-10T09:00:00Z'), end: new Date('2025-04-11T09:00:00Z') },
        };
      }
      return {};
    }),
  },
}));

// Prisma mock abrangendo property.findMany e availability.upsert
const upserts: any[] = [];
const prismaMock = {
  property: {
    findMany: vi.fn(async () => [
      { id: 'prop-1', calendarUrl: 'https://example.com/one.ics' },
      { id: 'prop-3', calendarUrl: 'https://example.com/three.ics' },
    ]),
  },
  availability: {
    upsert: vi.fn(async ({ where, create, update }: any) => {
      const existing = upserts.find((u) => u.where.externalId === where.externalId);
      if (existing) {
        existing.update = update;
        return { id: existing.where.externalId, ...update };
      }
      const rec = { where, create };
      upserts.push(rec);
      return { id: where.externalId, ...create };
    }),
  },
};

describe('CalendarSyncService scheduledSync', () => {
  let service: CalendarSyncService;

  beforeEach(() => {
    upserts.length = 0;
    vi.clearAllMocks();
    service = new CalendarSyncService(prismaMock as any);
  });

  it('executa scheduledSync e sincroniza todos os calendários retornados', async () => {
    await service.scheduledSync();

    expect(prismaMock.property.findMany).toHaveBeenCalledTimes(1);
    // prop-1 -> 1 evento; prop-3 -> 2 eventos => 3 upserts
    expect(prismaMock.availability.upsert).toHaveBeenCalledTimes(3);

    const externalIds = (prismaMock.availability.upsert as any).mock.calls.map((c: any) => c[0].where.externalId).sort();
    expect(externalIds).toEqual(['one-1', 'three-A', 'three-B']);
  });
});
