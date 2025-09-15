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
const auth_service_1 = require("../src/auth/auth.service");
const jwt_1 = require("@nestjs/jwt");
const properties_service_1 = require("../src/properties/properties.service");
const unsplash_service_1 = require("../src/unsplash/unsplash.service");
(0, vitest_1.describe)('Properties E2E', () => {
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
        }));
        await app.init();
        prisma = moduleRef.get(prisma_service_1.PrismaService);
        const authService = moduleRef.get(auth_service_1.AuthService);
        const jwtService = moduleRef.get(jwt_1.JwtService);
        const propertiesService = moduleRef.get(properties_service_1.PropertiesService);
        const unsplashService = moduleRef.get(unsplash_service_1.UnsplashService);
        authService.prisma = prisma;
        authService.jwt = jwtService;
        propertiesService.prisma = prisma;
        propertiesService.unsplashService = unsplashService;
    });
    (0, vitest_1.beforeEach)(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
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
    const setupUsers = async () => {
        const timestamp = Date.now();
        const randomId = Math.floor(Math.random() * 10000);
        const testPrefix = `props-${timestamp}-${randomId}`;
        const userAEmail = `userA-${testPrefix}@test.com`;
        const userBEmail = `userB-${testPrefix}@test.com`;
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/register')
            .send({ email: userAEmail, password: 'password123', name: 'User A' })
            .expect(201);
        await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/register')
            .send({ email: userBEmail, password: 'password123', name: 'User B' })
            .expect(201);
        const loginARes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userAEmail, password: 'password123' })
            .expect(200);
        const userAToken = loginARes.body.access_token;
        const loginBRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/auth/login')
            .send({ email: userBEmail, password: 'password123' })
            .expect(200);
        const userBToken = loginBRes.body.access_token;
        return { userAEmail, userBEmail, userAToken, userBToken };
    };
    (0, vitest_1.it)('POST /properties - deve criar uma nova propriedade para um usuário autenticado', async () => {
        const { userAToken } = await setupUsers();
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .post('/properties')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
            title: 'Casa de Praia',
            description: 'Uma bela casa na praia',
            address: 'Rua das Palmeiras, 123',
            pricePerNight: 250.00,
            bedrooms: 3,
            bathrooms: 2
        })
            .expect(201);
        (0, vitest_1.expect)(res.body).toMatchObject({
            title: 'Casa de Praia',
            description: 'Uma bela casa na praia',
            address: 'Rua das Palmeiras, 123',
            pricePerNight: 250.00,
            bedrooms: 3,
            bathrooms: 2
        });
        (0, vitest_1.expect)(res.body.id).toBeDefined();
    });
    (0, vitest_1.it)('POST /properties - deve criar múltiplas propriedades para usuários diferentes', async () => {
        const { userAToken, userBToken } = await setupUsers();
        const propA1 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/properties')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
            title: 'Casa de Praia',
            description: 'Uma bela casa na praia',
            address: 'Rua das Palmeiras, 123',
            pricePerNight: 250.00,
            bedrooms: 3,
            bathrooms: 2
        })
            .expect(201);
        const propA2 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/properties')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
            title: 'Apartamento Centro',
            description: 'Apartamento no centro da cidade',
            address: 'Av. Principal, 456',
            pricePerNight: 180.00,
            bedrooms: 2,
            bathrooms: 1
        })
            .expect(201);
        const propB1 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/properties')
            .set('Authorization', `Bearer ${userBToken}`)
            .send({
            title: 'Casa de Campo',
            description: 'Casa para relaxar no campo',
            address: 'Estrada Rural, 789',
            pricePerNight: 200.00,
            bedrooms: 4,
            bathrooms: 3
        })
            .expect(201);
        const resA = await (0, supertest_1.default)(app.getHttpServer())
            .get('/properties')
            .set('Authorization', `Bearer ${userAToken}`)
            .expect(200);
        (0, vitest_1.expect)(resA.body).toHaveLength(2);
        (0, vitest_1.expect)(resA.body.every((property) => property.title === 'Casa de Praia' || property.title === 'Apartamento Centro')).toBe(true);
        const resB = await (0, supertest_1.default)(app.getHttpServer())
            .get('/properties')
            .set('Authorization', `Bearer ${userBToken}`)
            .expect(200);
        (0, vitest_1.expect)(resB.body).toHaveLength(1);
        (0, vitest_1.expect)(resB.body[0].title).toBe('Casa de Campo');
    });
    (0, vitest_1.it)('GET /properties/:id - deve permitir acesso apenas ao dono', async () => {
        const { userAToken, userBToken } = await setupUsers();
        const propRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/properties')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
            title: 'Casa Teste',
            description: 'Casa para teste',
            address: 'Rua Teste, 123',
            pricePerNight: 100.00,
            bedrooms: 2,
            bathrooms: 1
        })
            .expect(201);
        const propertyId = propRes.body.id;
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get(`/properties/${propertyId}`)
            .set('Authorization', `Bearer ${userAToken}`)
            .expect(200);
        (0, vitest_1.expect)(res.body.title).toBe('Casa Teste');
        await (0, supertest_1.default)(app.getHttpServer())
            .get(`/properties/${propertyId}`)
            .set('Authorization', `Bearer ${userBToken}`)
            .expect(403);
    });
    (0, vitest_1.it)('PATCH /properties/:id - deve permitir atualização apenas pelo dono', async () => {
        const { userAToken, userBToken } = await setupUsers();
        const propRes = await (0, supertest_1.default)(app.getHttpServer())
            .post('/properties')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
            title: 'Casa Original',
            description: 'Descrição original',
            address: 'Rua Original, 123',
            pricePerNight: 100.00,
            bedrooms: 2,
            bathrooms: 1
        })
            .expect(201);
        const propertyId = propRes.body.id;
        const updateData = {
            title: 'Casa Atualizada',
            description: 'Descrição atualizada',
            pricePerNight: 150.00
        };
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/properties/${propertyId}`)
            .set('Authorization', `Bearer ${userAToken}`)
            .send(updateData)
            .expect(200);
        (0, vitest_1.expect)(res.body).toMatchObject({
            title: 'Casa Atualizada',
            description: 'Descrição atualizada',
            pricePerNight: 150.00
        });
        await (0, supertest_1.default)(app.getHttpServer())
            .patch(`/properties/${propertyId}`)
            .set('Authorization', `Bearer ${userBToken}`)
            .send(updateData)
            .expect(403);
    });
    (0, vitest_1.it)('DELETE /properties/:id - deve permitir exclusão apenas pelo dono', async () => {
        const { userAToken, userBToken } = await setupUsers();
        const prop1 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/properties')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
            title: 'Casa 1',
            description: 'Primeira casa',
            address: 'Rua 1, 123',
            pricePerNight: 100.00,
            bedrooms: 2,
            bathrooms: 1
        })
            .expect(201);
        const prop2 = await (0, supertest_1.default)(app.getHttpServer())
            .post('/properties')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
            title: 'Casa 2',
            description: 'Segunda casa',
            address: 'Rua 2, 456',
            pricePerNight: 200.00,
            bedrooms: 3,
            bathrooms: 2
        })
            .expect(201);
        await (0, supertest_1.default)(app.getHttpServer())
            .delete(`/properties/${prop1.body.id}`)
            .set('Authorization', `Bearer ${userBToken}`)
            .expect(403);
        await (0, supertest_1.default)(app.getHttpServer())
            .delete(`/properties/${prop1.body.id}`)
            .set('Authorization', `Bearer ${userAToken}`)
            .expect(200);
        await (0, supertest_1.default)(app.getHttpServer())
            .get(`/properties/${prop1.body.id}`)
            .set('Authorization', `Bearer ${userAToken}`)
            .expect(404);
        const res = await (0, supertest_1.default)(app.getHttpServer())
            .get('/properties')
            .set('Authorization', `Bearer ${userAToken}`)
            .expect(200);
        (0, vitest_1.expect)(res.body).toHaveLength(1);
        (0, vitest_1.expect)(res.body[0].title).toBe('Casa 2');
    });
});
//# sourceMappingURL=properties.e2e-spec.js.map