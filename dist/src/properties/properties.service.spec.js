"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const common_1 = require("@nestjs/common");
const properties_service_1 = require("./properties.service");
const createPropertyData = (overrides = {}) => ({
    title: 'Casa Teste',
    description: 'Uma casa para testes',
    address: 'Rua dos Testes, 123',
    pricePerNight: 100.0,
    bedrooms: 2,
    bathrooms: 1,
    ...overrides
});
const properties = [];
const prismaMock = {
    property: {
        create: vitest_1.vi.fn(async ({ data }) => {
            const newProp = { id: String(properties.length + 1), ownerId: data.userId, ...data };
            properties.push(newProp);
            return newProp;
        }),
        findMany: vitest_1.vi.fn(async ({ where }) => {
            if (where?.userId) {
                return properties.filter(p => p.ownerId === where.userId);
            }
            return properties;
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
        const mockUnsplashService = {
            getRandomCuratedArchitectureImage: vitest_1.vi.fn().mockReturnValue('https://example.com/image.jpg'),
        };
        service = new properties_service_1.PropertiesService(prismaMock, mockUnsplashService);
    });
    (0, vitest_1.describe)('create', () => {
        (0, vitest_1.it)('cria propriedade para o usuário', async () => {
            const prop = await service.create(ownerA, createPropertyData({ title: 'Casa 1' }));
            (0, vitest_1.expect)(prop.userId).toBe(ownerA);
            (0, vitest_1.expect)(prop.title).toBe('Casa 1');
        });
    });
    (0, vitest_1.describe)('findOne', () => {
        (0, vitest_1.it)('retorna propriedade se owner correto', async () => {
            const created = await service.create(ownerA, createPropertyData({ title: 'Apto' }));
            const found = await service.findOne(ownerA, created.id);
            (0, vitest_1.expect)(found.id).toBe(created.id);
        });
        (0, vitest_1.it)('lança Forbidden se owner diferente', async () => {
            const created = await service.create(ownerA, createPropertyData({ title: 'Apto' }));
            await (0, vitest_1.expect)(service.findOne(ownerB, created.id)).rejects.toBeInstanceOf(common_1.ForbiddenException);
        });
        (0, vitest_1.it)('lança NotFound se não existe', async () => {
            await (0, vitest_1.expect)(service.findOne(ownerA, '999')).rejects.toBeInstanceOf(common_1.NotFoundException);
        });
    });
    (0, vitest_1.describe)('update', () => {
        (0, vitest_1.it)('atualiza se owner correto', async () => {
            const created = await service.create(ownerA, createPropertyData({ title: 'Velho' }));
            const updated = await service.update(ownerA, created.id, { title: 'Novo' });
            (0, vitest_1.expect)(updated.title).toBe('Novo');
        });
        (0, vitest_1.it)('lança Forbidden se owner diferente', async () => {
            const created = await service.create(ownerA, createPropertyData({ title: 'Velho' }));
            await (0, vitest_1.expect)(service.update(ownerB, created.id, { title: 'Hack' })).rejects.toBeInstanceOf(common_1.ForbiddenException);
        });
    });
    (0, vitest_1.describe)('remove', () => {
        (0, vitest_1.it)('remove se owner correto', async () => {
            const created = await service.create(ownerA, createPropertyData({ title: 'Deletar' }));
            const res = await service.remove(ownerA, created.id);
            (0, vitest_1.expect)(res).toEqual({ deleted: true });
            (0, vitest_1.expect)(properties.find((p) => p.id === created.id)).toBeUndefined();
        });
        (0, vitest_1.it)('lança Forbidden se owner diferente', async () => {
            const created = await service.create(ownerA, createPropertyData({ title: 'Deletar' }));
            await (0, vitest_1.expect)(service.remove(ownerB, created.id)).rejects.toBeInstanceOf(common_1.ForbiddenException);
        });
    });
    (0, vitest_1.describe)('findAll', () => {
        (0, vitest_1.it)('retorna apenas propriedades do owner', async () => {
            await service.create(ownerA, createPropertyData({ title: 'Casa A1' }));
            await service.create(ownerA, createPropertyData({ title: 'Casa A2' }));
            await service.create(ownerB, createPropertyData({ title: 'Casa B1' }));
            const propsA = await service.findAll(ownerA);
            const propsB = await service.findAll(ownerB);
            (0, vitest_1.expect)(propsA).toHaveLength(2);
            (0, vitest_1.expect)(propsB).toHaveLength(1);
            (0, vitest_1.expect)(propsA.map((p) => p.title)).toEqual(['Casa A1', 'Casa A2']);
        });
    });
});
//# sourceMappingURL=properties.service.spec.js.map