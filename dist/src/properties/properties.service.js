"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropertiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const unsplash_service_1 = require("../unsplash/unsplash.service");
let PropertiesService = class PropertiesService {
    constructor(prisma, unsplashService) {
        this.prisma = prisma;
        this.unsplashService = unsplashService;
    }
    async create(userId, data) {
        const imageUrl = data.imageUrl || this.unsplashService.getRandomCuratedArchitectureImage();
        const propertyData = {
            title: data.title,
            description: data.description,
            address: data.address || data.location || '',
            pricePerNight: data.pricePerNight || data.price || 0,
            bedrooms: data.bedrooms || 1,
            bathrooms: data.bathrooms || 1,
            imageUrl: imageUrl,
            userId: userId
        };
        return this.prisma.property.create({
            data: propertyData
        });
    }
    async findAll(userId) {
        return this.prisma.property.findMany({ where: { userId } });
    }
    async findOne(userId, id) {
        const property = await this.prisma.property.findUnique({ where: { id } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        if (property.userId !== userId)
            throw new common_1.ForbiddenException();
        return property;
    }
    async update(userId, id, data) {
        const property = await this.prisma.property.findUnique({ where: { id } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        if (property.userId !== userId)
            throw new common_1.ForbiddenException();
        const updateData = { ...data };
        if (!updateData.imageUrl && !property.imageUrl) {
            updateData.imageUrl = this.unsplashService.getRandomCuratedArchitectureImage();
        }
        return this.prisma.property.update({ where: { id }, data: updateData });
    }
    async remove(userId, id) {
        const property = await this.prisma.property.findUnique({ where: { id } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        if (property.userId !== userId)
            throw new common_1.ForbiddenException();
        await this.prisma.property.delete({ where: { id } });
        return { deleted: true };
    }
    async getCalendar(userId, propertyId) {
        const property = await this.prisma.property.findUnique({
            where: { id: propertyId }
        });
        if (!property) {
            throw new Error('Property not found');
        }
        if (property.userId !== userId) {
            throw new Error('Access denied');
        }
        const bookings = await this.prisma.booking.findMany({
            where: { propertyId },
            orderBy: { startDate: 'asc' }
        });
        const now = new Date();
        const calendarLines = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//SuaEmpresa//SeuApp//PT',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            `X-WR-CALNAME:${property.title}`,
            `X-WR-CALDESC:Calendário de reservas para ${property.title}`,
        ];
        for (const booking of bookings) {
            const uid = `booking-${booking.id}@suaempresa.com`;
            const startDateStr = this.formatICalDate(booking.startDate);
            const endDateStr = this.formatICalDate(booking.endDate);
            const summary = booking.type === 'RESERVATION' ? 'RESERVA' : 'BLOQUEADO';
            const createdAtStr = this.formatICalDateTime(booking.createdAt);
            calendarLines.push('BEGIN:VEVENT', `UID:${uid}`, `DTSTAMP:${this.formatICalDateTime(now)}`, `DTSTART;VALUE=DATE:${startDateStr}`, `DTEND;VALUE=DATE:${endDateStr}`, `SUMMARY:${summary}`, `DESCRIPTION:${booking.type === 'RESERVATION' ? 'Período reservado' : 'Período bloqueado'} - ${property.title}`, `LOCATION:${property.address}`, `CREATED:${createdAtStr}`, `LAST-MODIFIED:${createdAtStr}`, 'STATUS:CONFIRMED', 'TRANSP:OPAQUE', 'END:VEVENT');
        }
        calendarLines.push('END:VCALENDAR');
        return calendarLines.join('\r\n');
    }
    formatICalDate(date) {
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        return `${year}${month}${day}`;
    }
    formatICalDateTime(date) {
        const year = date.getUTCFullYear();
        const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const day = date.getUTCDate().toString().padStart(2, '0');
        const hours = date.getUTCHours().toString().padStart(2, '0');
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        unsplash_service_1.UnsplashService])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map