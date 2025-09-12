"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const calendar_sync_service_1 = require("./calendar-sync.service");
vitest_1.vi.mock('node-ical', () => ({
    async: {
        fromURL: vitest_1.vi.fn(async (url) => {
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
const upserts = [];
const prismaMock = {
    property: {
        findMany: vitest_1.vi.fn(async () => [
            { id: 'prop-1', calendarUrl: 'https://example.com/one.ics' },
            { id: 'prop-3', calendarUrl: 'https://example.com/three.ics' },
        ]),
    },
    availability: {
        upsert: vitest_1.vi.fn(async ({ where, create, update }) => {
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
(0, vitest_1.describe)('CalendarSyncService scheduledSync', () => {
    let service;
    (0, vitest_1.beforeEach)(() => {
        upserts.length = 0;
        vitest_1.vi.clearAllMocks();
        service = new calendar_sync_service_1.CalendarSyncService(prismaMock);
    });
    (0, vitest_1.it)('executa scheduledSync e sincroniza todos os calendários retornados', async () => {
        await service.scheduledSync();
        (0, vitest_1.expect)(prismaMock.property.findMany).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(prismaMock.availability.upsert).toHaveBeenCalledTimes(3);
        const externalIds = prismaMock.availability.upsert.mock.calls.map((c) => c[0].where.externalId).sort();
        (0, vitest_1.expect)(externalIds).toEqual(['one-1', 'three-A', 'three-B']);
    });
});
//# sourceMappingURL=calendar-scheduled-sync.spec.js.map