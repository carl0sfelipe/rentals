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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const vitest_1 = require("vitest");
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const auth_service_1 = require("../src/auth/auth.service");
const properties_service_1 = require("../src/properties/properties.service");
const users = [];
const properties = [];
class PrismaMock {
    constructor() {
        this.user = {
            findUnique: async ({ where: { email } }) => users.find((u) => u.email === email) || null,
            create: async ({ data }) => { const nu = { id: String(users.length + 1), ...data }; users.push(nu); return nu; },
        };
        this.property = {
            create: async ({ data }) => { const np = { id: String(properties.length + 1), ...data }; properties.push(np); return np; },
            findUnique: async ({ where: { id } }) => properties.find((p) => p.id === id) || null,
            update: async ({ where: { id }, data }) => { const i = properties.findIndex((p) => p.id === id); if (i === -1)
                return null; properties[i] = { ...properties[i], ...data }; return properties[i]; },
            delete: async ({ where: { id } }) => { const i = properties.findIndex((p) => p.id === id); if (i === -1)
                return null; return properties.splice(i, 1)[0]; },
        };
    }
}
class JwtMock {
    async signAsync(payload) { return `token-${payload.sub}`; }
}
function extractUserIdFromAuth(header) {
    if (!header)
        return null;
    const parts = header.split(' ');
    if (parts.length !== 2)
        return null;
    const token = parts[1];
    if (!token.startsWith('token-'))
        return null;
    return token.replace('token-', '');
}
class AuthGuardMock {
    canActivate(ctx) {
        const req = ctx.switchToHttp().getRequest();
        const userId = extractUserIdFromAuth(req.headers['authorization']);
        if (!userId)
            throw new common_1.UnauthorizedException();
        req.user = { id: userId };
        return true;
    }
}
let AuthControllerMock = class AuthControllerMock {
    constructor(auth) {
        this.auth = auth;
    }
    register(body) { return this.auth.register(body); }
    async login(body) { return this.auth.login(body); }
};
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthControllerMock.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthControllerMock.prototype, "login", null);
AuthControllerMock = __decorate([
    (0, common_1.Controller)('auth'),
    __param(0, (0, common_1.Inject)(auth_service_1.AuthService)),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthControllerMock);
let PropertiesControllerMock = class PropertiesControllerMock {
    constructor(service) {
        this.service = service;
    }
    create(req, body) { return this.service.create(req.user.id, body); }
    get(req, id) { return this.service.findOne(req.user.id, id); }
    update(req, id, body) { return this.service.update(req.user.id, id, body); }
    async remove(req, id) { return this.service.remove(req.user.id, id); }
};
__decorate([
    (0, common_1.UseGuards)(AuthGuardMock),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], PropertiesControllerMock.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(AuthGuardMock),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], PropertiesControllerMock.prototype, "get", null);
__decorate([
    (0, common_1.UseGuards)(AuthGuardMock),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], PropertiesControllerMock.prototype, "update", null);
__decorate([
    (0, common_1.UseGuards)(AuthGuardMock),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PropertiesControllerMock.prototype, "remove", null);
PropertiesControllerMock = __decorate([
    (0, common_1.Controller)('properties'),
    __param(0, (0, common_1.Inject)(properties_service_1.PropertiesService)),
    __metadata("design:paramtypes", [properties_service_1.PropertiesService])
], PropertiesControllerMock);
let TestAppModule = class TestAppModule {
};
TestAppModule = __decorate([
    (0, common_1.Module)({
        controllers: [AuthControllerMock, PropertiesControllerMock],
        providers: [
            { provide: 'PrismaService', useClass: PrismaMock },
            { provide: 'JwtService', useClass: JwtMock },
            auth_service_1.AuthService,
            properties_service_1.PropertiesService,
        ],
    })
], TestAppModule);
(0, vitest_1.describe)('Properties E2E', () => {
    let app;
    let server;
    let tokenA;
    let tokenB;
    let propertyId;
    (0, vitest_1.beforeAll)(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({ imports: [TestAppModule] }).compile();
        app = moduleRef.createNestApplication();
        await app.init();
        server = app.getHttpServer();
        await (0, supertest_1.default)(server).post('/auth/register').send({ email: 'a@test.com', password: 'a' }).expect(201);
        const loginA = await (0, supertest_1.default)(server).post('/auth/login').send({ email: 'a@test.com', password: 'a' }).expect(200);
        tokenA = loginA.body.access_token;
        await (0, supertest_1.default)(server).post('/auth/register').send({ email: 'b@test.com', password: 'b' }).expect(201);
        const loginB = await (0, supertest_1.default)(server).post('/auth/login').send({ email: 'b@test.com', password: 'b' }).expect(200);
        tokenB = loginB.body.access_token;
    });
    (0, vitest_1.afterAll)(async () => { await app.close(); });
    (0, vitest_1.it)('endpoints requerem auth (401 sem token)', async () => {
        await (0, supertest_1.default)(server).post('/properties').send({ title: 'Sem token' }).expect(401);
        await (0, supertest_1.default)(server).get('/properties/1').expect(401);
        await (0, supertest_1.default)(server).patch('/properties/1').send({ title: 'x' }).expect(401);
        await (0, supertest_1.default)(server).delete('/properties/1').expect(401);
    });
    (0, vitest_1.it)('CRUD completo com usuário A', async () => {
        const createRes = await (0, supertest_1.default)(server)
            .post('/properties')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ title: 'Casa A' })
            .expect(201);
        propertyId = createRes.body.id;
        (0, vitest_1.expect)(createRes.body.ownerId).toBe('1');
        const getRes = await (0, supertest_1.default)(server)
            .get(`/properties/${propertyId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(200);
        (0, vitest_1.expect)(getRes.body.id).toBe(propertyId);
        const patchRes = await (0, supertest_1.default)(server)
            .patch(`/properties/${propertyId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ title: 'Casa A+' })
            .expect(200);
        (0, vitest_1.expect)(patchRes.body.title).toBe('Casa A+');
        const delRes = await (0, supertest_1.default)(server)
            .delete(`/properties/${propertyId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(200);
        (0, vitest_1.expect)(delRes.body).toEqual({ deleted: true });
    });
    (0, vitest_1.it)('Usuário B não pode acessar propriedade de A (403)', async () => {
        const createRes = await (0, supertest_1.default)(server)
            .post('/properties')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ title: 'Casa A2' })
            .expect(201);
        const propId = createRes.body.id;
        await (0, supertest_1.default)(server)
            .get(`/properties/${propId}`)
            .set('Authorization', `Bearer ${tokenB}`)
            .expect(403);
        await (0, supertest_1.default)(server)
            .patch(`/properties/${propId}`)
            .set('Authorization', `Bearer ${tokenB}`)
            .send({ title: 'Hack' })
            .expect(403);
        await (0, supertest_1.default)(server)
            .delete(`/properties/${propId}`)
            .set('Authorization', `Bearer ${tokenB}`)
            .expect(403);
    });
});
//# sourceMappingURL=properties.e2e-spec.js.map