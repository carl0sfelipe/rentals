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
let PropertiesService = class PropertiesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userId, data) {
        return this.prisma.property.create({ data: { ...data, ownerId: userId } });
    }
    async findOne(userId, id) {
        const property = await this.prisma.property.findUnique({ where: { id } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        if (property.ownerId !== userId)
            throw new common_1.ForbiddenException();
        return property;
    }
    async update(userId, id, data) {
        const property = await this.prisma.property.findUnique({ where: { id } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        if (property.ownerId !== userId)
            throw new common_1.ForbiddenException();
        return this.prisma.property.update({ where: { id }, data });
    }
    async remove(userId, id) {
        const property = await this.prisma.property.findUnique({ where: { id } });
        if (!property)
            throw new common_1.NotFoundException('Property not found');
        if (property.ownerId !== userId)
            throw new common_1.ForbiddenException();
        await this.prisma.property.delete({ where: { id } });
        return { deleted: true };
    }
};
exports.PropertiesService = PropertiesService;
exports.PropertiesService = PropertiesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('PrismaService')),
    __metadata("design:paramtypes", [Object])
], PropertiesService);
//# sourceMappingURL=properties.service.js.map