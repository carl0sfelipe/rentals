"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const mockUsers = [];
const prismaMock = {
    user: {
        findUnique: vitest_1.vi.fn(async (args) => mockUsers.find(u => u.email === args.where.email) || null),
        create: vitest_1.vi.fn(async (args) => {
            const newUser = { id: String(mockUsers.length + 1), ...args.data };
            mockUsers.push(newUser);
            return newUser;
        }),
    },
};
const jwtMock = { signAsync: vitest_1.vi.fn(async () => 'signed-jwt-token') };
const hasherMock = {
    hash: vitest_1.vi.fn(async (plain) => `hashed:${plain}`),
    compare: vitest_1.vi.fn(async (plain, hashed) => hashed === `hashed:${plain}`),
};
let service;
(0, vitest_1.describe)('AuthService (unit)', () => {
    (0, vitest_1.beforeEach)(() => {
        mockUsers.length = 0;
        vitest_1.vi.clearAllMocks();
        service = new auth_service_1.AuthService(prismaMock, jwtMock, hasherMock);
    });
    (0, vitest_1.describe)('register', () => {
        (0, vitest_1.it)('deve criar novo usuário quando email não existe', async () => {
            const res = await service.register({ email: 'a@a.com', password: '123456' });
            (0, vitest_1.expect)(res).toHaveProperty('id');
            (0, vitest_1.expect)(res.email).toBe('a@a.com');
            (0, vitest_1.expect)(hasherMock.hash).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(prismaMock.user.create).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('deve chamar função de hash de senha', async () => {
            await service.register({ email: 'b@b.com', password: 'secret' });
            (0, vitest_1.expect)(hasherMock.hash).toHaveBeenCalledWith('secret');
        });
        (0, vitest_1.it)('deve lançar ConflictException se email já estiver em uso', async () => {
            await service.register({ email: 'c@c.com', password: '123' });
            await (0, vitest_1.expect)(service.register({ email: 'c@c.com', password: '456' })).rejects.toBeInstanceOf(common_1.ConflictException);
        });
    });
    (0, vitest_1.describe)('login', () => {
        (0, vitest_1.it)('deve retornar access_token para credenciais válidas', async () => {
            await service.register({ email: 'login@test.com', password: 'pw' });
            const res = await service.login({ email: 'login@test.com', password: 'pw' });
            (0, vitest_1.expect)(res).toEqual({ access_token: 'signed-jwt-token' });
            (0, vitest_1.expect)(jwtMock.signAsync).toHaveBeenCalledTimes(1);
        });
        (0, vitest_1.it)('deve lançar UnauthorizedException para email não encontrado', async () => {
            await (0, vitest_1.expect)(service.login({ email: 'x@x.com', password: 'pw' })).rejects.toBeInstanceOf(common_1.UnauthorizedException);
        });
        (0, vitest_1.it)('deve lançar UnauthorizedException para senha incorreta', async () => {
            await service.register({ email: 'y@y.com', password: 'correct' });
            await (0, vitest_1.expect)(service.login({ email: 'y@y.com', password: 'wrong' })).rejects.toBeInstanceOf(common_1.UnauthorizedException);
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map