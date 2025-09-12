"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
vitest_1.vi.mock('node-ical', () => {
    return {
        async: {
            fromURL: vitest_1.vi.fn(async () => ({
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
const calendar_sync_service_1 = require("./calendar-sync.service");
const availabilities = [];
const prismaMock = {
    availability: {
        upsert: vitest_1.vi.fn(async ({ where, create, update }) => {
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
(0, vitest_1.describe)('CalendarSyncService', () => {
    let service;
    const propertyId = 'prop-123';
    const calendarUrl = 'https://example.com/ical.ics';
    (0, vitest_1.beforeEach)(() => {
        availabilities.length = 0;
        vitest_1.vi.clearAllMocks();
        service = new calendar_sync_service_1.CalendarSyncService(prismaMock);
    });
    (0, vitest_1.it)('sincroniza eventos criando ou atualizando disponibilidades', async () => {
        const result = await service.syncForProperty({ propertyId, url: calendarUrl });
        (0, vitest_1.expect)(result).toEqual({ processed: 2 });
        (0, vitest_1.expect)(prismaMock.availability.upsert).toHaveBeenCalledTimes(2);
        const calls = prismaMock.availability.upsert.mock.calls;
        const externalIds = calls.map((c) => c[0].where.externalId).sort();
        (0, vitest_1.expect)(externalIds).toEqual(['ev-1', 'ev-2']);
        const firstCallArgs = calls[0][0];
        (0, vitest_1.expect)(firstCallArgs.create.propertyId).toBe(propertyId);
        (0, vitest_1.expect)(new Date(firstCallArgs.create.start).toISOString()).toBe('2025-01-10T12:00:00.000Z');
        (0, vitest_1.expect)(new Date(firstCallArgs.create.end).toISOString()).toBe('2025-01-12T10:00:00.000Z');
    });
});
//# sourceMappingURL=calendar-sync.service.spec.js.map