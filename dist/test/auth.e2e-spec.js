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
const users = [];
class PrismaMock {
    constructor() {
        this.user = {
            findUnique: async ({ where: { email } }) => users.find((u) => u.email === email) || null,
            create: async ({ data }) => {
                const newU = { id: String(users.length + 1), ...data };
                users.push(newU);
                return newU;
            },
        };
    }
}
class JwtMock {
    async signAsync() { return 'token-e2e'; }
}
let AuthController = class AuthController {
    constructor(auth) {
        this.auth = auth;
    }
    register(body) { return this.auth.register(body); }
    login(body) { return this.auth.login(body); }
};
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __param(0, (0, common_1.Inject)(auth_service_1.AuthService)),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
let AuthTestModule = class AuthTestModule {
};
AuthTestModule = __decorate([
    (0, common_1.Module)({
        controllers: [AuthController],
        providers: [
            { provide: 'PrismaService', useClass: PrismaMock },
            { provide: 'JwtService', useClass: JwtMock },
            auth_service_1.PBKDF2Hasher,
            { provide: 'PasswordHasher', useExisting: auth_service_1.PBKDF2Hasher },
            auth_service_1.AuthService,
        ],
    })
], AuthTestModule);
(0, vitest_1.describe)('Auth E2E', () => {
    let app;
    (0, vitest_1.beforeAll)(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({ imports: [AuthTestModule] }).compile();
        app = moduleRef.createNestApplication();
        await app.init();
    });
    (0, vitest_1.beforeEach)(() => { users.length = 0; });
    (0, vitest_1.afterAll)(async () => { await app.close(); });
    (0, vitest_1.it)('POST /auth/register deve criar usuário (201)', async () => {
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'e2e@test.com', password: '123' })
            .expect(201);
        (0, vitest_1.expect)(res.body).toMatchObject({ email: 'e2e@test.com' });
    });
    (0, vitest_1.it)('POST /auth/login deve retornar token (200)', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'login@test.com', password: '123' })
            .expect(201);
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/login')
            .send({ email: 'login@test.com', password: '123' })
            .expect(200);
        (0, vitest_1.expect)(res.body).toEqual({ access_token: 'token-e2e' });
    });
});
//# sourceMappingURL=auth.e2e-spec.js.map