import 'reflect-metadata';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Properties E2E', () => {
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
    }));
    await app.init();

    prisma = moduleRef.get(PrismaService);
  });

  // Remover beforeEach para evitar conflitos entre testes paralelos

  afterAll(async () => {
    // Limpar dados de teste na ordem correta
    await (prisma as any).property.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  it('POST /properties - deve criar uma nova propriedade para um usuário autenticado', async () => {
    const timestamp = Date.now();
    const email = `user-${timestamp}@test.com`;
    
    // Primeiro, registrar um usuário
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password: 'password123', name: 'Test User' })
      .expect(201);

    // Segundo, fazer login para obter o token
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'password123' })
      .expect(200);

    const accessToken = loginRes.body.access_token;

    // Finalmente, fazer POST para /properties com o token
    const res = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Casa de Praia',
        description: 'Uma bela casa na praia',
        address: 'Rua da Praia, 123',
        pricePerNight: 150.0,
        bedrooms: 3,
        bathrooms: 2
      })
      .expect(201);

    expect(res.body).toMatchObject({
      title: 'Casa de Praia',
      description: 'Uma bela casa na praia',
      address: 'Rua da Praia, 123',
      pricePerNight: 150.0,
      bedrooms: 3,
      bathrooms: 2
    });
    expect(res.body.id).toBeDefined();
  });
});
