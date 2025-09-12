import 'reflect-metadata';
import { config } from 'dotenv';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

// Carregar variáveis de ambiente de teste
config({ path: '.env.test' });

describe('Simple Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
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
    prisma = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Limpar dados de teste na ordem correta
    await (prisma as any).property.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  // Remover beforeEach para evitar conflitos entre testes paralelos

  it('POST /auth/register deve criar usuário (201)', async () => {
    const timestamp = Date.now();
    const email = `simple-${timestamp}@test.com`;
    
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Simple User' })
      .expect(201);
    
    expect(res.body).toMatchObject({ email, name: 'Simple User' });
    expect(res.body.id).toBeDefined();
  });

  it('POST /auth/login deve retornar token (200)', async () => {
    const timestamp = Date.now();
    const email = `login-${timestamp}@test.com`;
    
    // Primeiro registrar um usuário
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Login User' })
      .expect(201);

    // Então fazer login
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);
    
    expect(res.body.access_token).toBeDefined();
    expect(typeof res.body.access_token).toBe('string');
  });

  it('POST /auth/register deve falhar com email inválido (400)', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'invalid-email', password: 'password123', name: 'Invalid Email' })
      .expect(400);
  });

  it('POST /auth/register deve falhar com senha curta (400)', async () => {
    const timestamp = Date.now();
    const email = `short-${timestamp}@example.com`;
    
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'short', name: 'Short Pass' })
      .expect(400);
  });
});
