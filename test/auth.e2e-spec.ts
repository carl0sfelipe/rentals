import 'reflect-metadata';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
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

    prisma = moduleRef.get(PrismaService);
    
    // Limpar banco antes de começar
    await (prisma as any).booking.deleteMany({});
    await (prisma as any).property.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Limpar dados de teste na ordem correta - bookings primeiro, depois properties, depois users
    await (prisma as any).booking.deleteMany({});
    await (prisma as any).property.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  // Remover beforeEach para evitar conflitos entre testes paralelos

  it('POST /auth/register deve criar usuário (201)', async () => {
    const timestamp = Date.now();
    const email = `e2e-${timestamp}@test.com`;
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'E2E User' })
      .expect(201);
    expect(res.body).toMatchObject({ email, name: 'E2E User' });
  });

  it('POST /auth/login deve retornar token (200)', async () => {
    const timestamp = Date.now();
    const email = `login-${timestamp}@test.com`;
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Login User' })
      .expect(201);
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    expect(res.body).toEqual({ access_token: expect.any(String) });
  });

  it('POST /auth/register - should fail if password is too short', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'short@example.com', password: 'short', name: 'Short User' })
      .expect(400);
  });
});
