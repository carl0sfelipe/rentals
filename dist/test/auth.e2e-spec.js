"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const vitest_1 = require("vitest");
const common_1 = require("@nestjs/common");
const testing_1 = require("@nestjs/testing");
const supertest_1 = __importDefault(require("supertest"));
const app_module_1 = require("../src/app.module");
const prisma_service_1 = require("../src/prisma/prisma.service");
(0, vitest_1.describe)('Auth E2E', () => {
    let app;
    let prisma;
    (0, vitest_1.beforeAll)(async () => {
        const moduleRef = await testing_1.Test.createTestingModule({
            imports: [app_module_1.AppModule],
        }).compile();
        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            disableErrorMessages: false,
            validationError: {
                target: false,
            },
        }));
        await app.init();
        prisma = moduleRef.get(prisma_service_1.PrismaService);
        await prisma.booking.deleteMany({});
        await prisma.property.deleteMany({});
        await prisma.user.deleteMany({});
    });
    (0, vitest_1.afterAll)(async () => {
        await prisma.booking.deleteMany({});
        await prisma.property.deleteMany({});
        await prisma.user.deleteMany({});
        await app.close();
    });
    (0, vitest_1.it)('POST /auth/register deve criar usuário (201)', async () => {
        const timestamp = Date.now();
        const email = `e2e-${timestamp}@test.com`;
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/register')
            .send({ email, password: 'password123', name: 'E2E User' })
            .expect(201);
        (0, vitest_1.expect)(res.body).toMatchObject({ email, name: 'E2E User' });
    });
    (0, vitest_1.it)('POST /auth/login deve retornar token (200)', async () => {
        const timestamp = Date.now();
        const email = `login-${timestamp}@test.com`;
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/register')
            .send({ email, password: 'password123', name: 'Login User' })
            .expect(201);
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/login')
            .send({ email, password: 'password123' })
            .expect(200);
        (0, vitest_1.expect)(res.body).toEqual({ access_token: vitest_1.expect.any(String) });
    });
    (0, vitest_1.it)('POST /auth/register - should fail if password is too short', async () => {
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/register')
            .send({ email: 'short@example.com', password: 'short', name: 'Short User' })
            .expect(400);
    });
});
//# sourceMappingURL=auth.e2e-spec.js.map