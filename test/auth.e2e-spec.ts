import 'reflect-metadata';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { INestApplication, Module, Controller, Post, Body, Inject, HttpCode } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthService, PBKDF2Hasher } from '../src/auth/auth.service';

// Mocks simples em memória para E2E inicial (substituir por Prisma real depois)
const users: any[] = [];

class PrismaMock {
  user = {
    findUnique: async ({ where: { email } }: any) => users.find((u) => u.email === email) || null,
    create: async ({ data }: any) => {
      const newU = { id: String(users.length + 1), ...data };
      users.push(newU);
      return newU;
    },
  };
}
class JwtMock { async signAsync() { return 'token-e2e'; } }

@Controller('auth')
class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Post('register') register(@Body() body: any) { return this.auth.register(body); }
  @Post('login') @HttpCode(200) login(@Body() body: any) { return this.auth.login(body); }
}

@Module({
  controllers: [AuthController],
  providers: [
    { provide: 'PrismaService', useClass: PrismaMock },
    { provide: 'JwtService', useClass: JwtMock },
    PBKDF2Hasher,
    { provide: 'PasswordHasher', useExisting: PBKDF2Hasher },
    AuthService,
  ],
})
class AuthTestModule {}

describe('Auth E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AuthTestModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  beforeEach(() => { users.length = 0; });
  afterAll(async () => { await app.close(); });

  it('POST /auth/register deve criar usuário (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'e2e@test.com', password: '123' })
      .expect(201);
    expect(res.body).toMatchObject({ email: 'e2e@test.com' });
  });

  it('POST /auth/login deve retornar token (200)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'login@test.com', password: '123' })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'login@test.com', password: '123' })
      .expect(200);
    expect(res.body).toEqual({ access_token: 'token-e2e' });
  });
});
