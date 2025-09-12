"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CalendarSyncService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarSyncService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
let CalendarSyncService = CalendarSyncService_1 = class CalendarSyncService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(CalendarSyncService_1.name);
    }
    async syncForProperty(params) {
        const { propertyId, url, horizonDays } = params;
        const ical = await Promise.resolve().then(() => __importStar(require('node-ical')));
        const data = await ical.async.fromURL(url);
        const now = Date.now();
        const horizonMillis = horizonDays != null ? horizonDays * 24 * 60 * 60 * 1000 : null;
        const events = Object.values(data).filter((v) => v && v.type === 'VEVENT');
        let processed = 0;
        for (const ev of events) {
            if (!ev.start)
                continue;
            const startDate = new Date(ev.start);
            if (horizonMillis != null && startDate.getTime() - now > horizonMillis)
                continue;
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
    async scheduledSync() {
        if (!this.prisma?.property?.findMany)
            return;
        try {
            this.logger.log('Iniciando sync periódico de calendários');
            const props = await this.prisma.property.findMany({
                where: { calendarUrl: { not: null } },
                select: { id: true, calendarUrl: true },
            });
            for (const p of props) {
                await this.syncForProperty({ propertyId: p.id, url: p.calendarUrl });
            }
            this.logger.log(`Sync concluído para ${props.length} propriedades`);
        }
        catch (e) {
            this.logger.error('Erro no sync periódico', e?.message);
        }
    }
};
exports.CalendarSyncService = CalendarSyncService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_30_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CalendarSyncService.prototype, "scheduledSync", null);
exports.CalendarSyncService = CalendarSyncService = CalendarSyncService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PrismaService')),
    __metadata("design:paramtypes", [Object])
], CalendarSyncService);
//# sourceMappingURL=calendar-sync.service.js.map