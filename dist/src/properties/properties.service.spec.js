"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const common_1 = require("@nestjs/common");
const properties_service_1 = require("./properties.service");
const properties = [];
const prismaMock = {
    property: {
        create: vitest_1.vi.fn(async ({ data }) => {
            const newProp = { id: String(properties.length + 1), ...data };
            properties.push(newProp);
            return newProp;
        }),
        findUnique: vitest_1.vi.fn(async ({ where: { id } }) => properties.find((p) => p.id === id) || null),
        update: vitest_1.vi.fn(async ({ where: { id }, data }) => {
            const idx = properties.findIndex((p) => p.id === id);
            if (idx === -1)
                return null;
            properties[idx] = { ...properties[idx], ...data };
            return properties[idx];
        }),
        delete: vitest_1.vi.fn(async ({ where: { id } }) => {
            const idx = properties.findIndex((p) => p.id === id);
            if (idx === -1)
                return null;
            const removed = properties.splice(idx, 1)[0];
            return removed;
        }),
    },
};
(0, vitest_1.describe)('PropertiesService (unit)', () => {
    let service;
    const ownerA = 'user-a';
    const ownerB = 'user-b';
    (0, vitest_1.beforeEach)(() => {
        properties.length = 0;
        vitest_1.vi.clearAllMocks();
        service = new properties_service_1.PropertiesService(prismaMock);
    });
    (0, vitest_1.describe)('create', () => {
        (0, vitest_1.it)('deve associar propriedade ao userId correto', async () => {
            const prop = await service.create(ownerA, { title: 'Casa 1' });
            (0, vitest_1.expect)(prop.ownerId).toBe(ownerA);
            (0, vitest_1.expect)(prismaMock.property.create).toHaveBeenCalled();
        });
    });
    (0, vitest_1.describe)('findOne', () => {
        (0, vitest_1.it)('retorna propriedade se owner correto', async () => {
            const created = await service.create(ownerA, { title: 'Apto' });
            const found = await service.findOne(ownerA, created.id);
            (0, vitest_1.expect)(found.id).toBe(created.id);
        });
        (0, vitest_1.it)('lança Forbidden se owner diferente', async () => {
            const created = await service.create(ownerA, { title: 'Apto' });
            await (0, vitest_1.expect)(service.findOne(ownerB, created.id)).rejects.toBeInstanceOf(common_1.ForbiddenException);
        });
        (0, vitest_1.it)('lança NotFound se não existe', async () => {
            await (0, vitest_1.expect)(service.findOne(ownerA, '999')).rejects.toBeInstanceOf(common_1.NotFoundException);
        });
    });
    (0, vitest_1.describe)('update', () => {
        (0, vitest_1.it)('atualiza se owner correto', async () => {
            const created = await service.create(ownerA, { title: 'Velho' });
            const updated = await service.update(ownerA, created.id, { title: 'Novo' });
            (0, vitest_1.expect)(updated.title).toBe('Novo');
        });
        (0, vitest_1.it)('lança Forbidden se owner diferente', async () => {
            const created = await service.create(ownerA, { title: 'Velho' });
            await (0, vitest_1.expect)(service.update(ownerB, created.id, { title: 'Hack' })).rejects.toBeInstanceOf(common_1.ForbiddenException);
        });
    });
    (0, vitest_1.describe)('remove', () => {
        (0, vitest_1.it)('remove se owner correto', async () => {
            const created = await service.create(ownerA, { title: 'Deletar' });
            const res = await service.remove(ownerA, created.id);
            (0, vitest_1.expect)(res).toEqual({ deleted: true });
            (0, vitest_1.expect)(properties.find((p) => p.id === created.id)).toBeUndefined();
        });
        (0, vitest_1.it)('lança Forbidden se owner diferente', async () => {
            const created = await service.create(ownerA, { title: 'Deletar' });
            await (0, vitest_1.expect)(service.remove(ownerB, created.id)).rejects.toBeInstanceOf(common_1.ForbiddenException);
        });
    });
});
//# sourceMappingURL=properties.service.spec.js.map