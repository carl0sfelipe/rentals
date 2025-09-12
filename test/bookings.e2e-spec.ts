import 'reflect-metadata';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Bookings E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Variáveis para reutilizar nos testes
  let userAToken: string;
  let userBToken: string;
  let userAEmail: string;
  let userBEmail: string;
  let propertyAId: string;
  let propertyBId: string;

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

  beforeEach(async () => {
    // Limpar todas as tabelas para garantir isolamento entre testes
    await (prisma as any).booking.deleteMany({});
    await (prisma as any).property.deleteMany({});
    await prisma.user.deleteMany({});

    // Setup inicial: criar dois usuários para testes de permissão
    const timestamp = Date.now();
    userAEmail = `userA-${timestamp}@test.com`;
    userBEmail = `userB-${timestamp}@test.com`;

    // Registrar User A
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: userAEmail, password: 'password123', name: 'User A' })
      .expect(201);

    // Registrar User B
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: userBEmail, password: 'password123', name: 'User B' })
      .expect(201);

    // Login User A
    const loginARes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userAEmail, password: 'password123' })
      .expect(200);
    userAToken = loginARes.body.access_token;

    // Login User B
    const loginBRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userBEmail, password: 'password123' })
      .expect(200);
    userBToken = loginBRes.body.access_token;

    // Criar propriedade para User A
    const propertyARes = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Casa de Praia User A',
        description: 'Uma bela casa na praia',
        address: 'Rua da Praia, 123',
        pricePerNight: 150.0,
        bedrooms: 3,
        bathrooms: 2
      })
      .expect(201);
    propertyAId = propertyARes.body.id;

    // Criar propriedade para User B
    const propertyBRes = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        title: 'Casa de Campo User B',
        description: 'Uma casa aconchegante no campo',
        address: 'Estrada do Campo, 789',
        pricePerNight: 120.0,
        bedrooms: 4,
        bathrooms: 3
      })
      .expect(201);
    propertyBId = propertyBRes.body.id;
  });

  afterAll(async () => {
    // Limpar dados de teste na ordem correta
    await (prisma as any).booking.deleteMany({});
    await (prisma as any).property.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  it('POST /properties/:propertyId/bookings - deve criar um novo bloqueio com sucesso para propriedade própria', async () => {
    const startDate = new Date('2025-12-01T10:00:00.000Z');
    const endDate = new Date('2025-12-05T10:00:00.000Z');

    const res = await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .expect(201);

    expect(res.body).toMatchObject({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      propertyId: propertyAId,
      type: 'BLOCKED' // Valor padrão
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
    expect(res.body.updatedAt).toBeDefined();
  });

  it('POST /properties/:propertyId/bookings - deve retornar 403 ao tentar criar bloqueio em propriedade de outro usuário', async () => {
    const startDate = new Date('2025-12-01T10:00:00.000Z');
    const endDate = new Date('2025-12-05T10:00:00.000Z');

    await request(app.getHttpServer())
      .post(`/properties/${propertyBId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`) // User A tentando criar booking na propriedade do User B
      .send({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .expect(403);
  });

  it('POST /properties/:propertyId/bookings - deve retornar 400 quando endDate for anterior à startDate', async () => {
    const startDate = new Date('2025-12-05T10:00:00.000Z');
    const endDate = new Date('2025-12-01T10:00:00.000Z'); // Data de fim anterior à data de início

    await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .expect(400);
  });

  it('POST /properties/:propertyId/bookings - deve retornar 400 quando startDate não for fornecida', async () => {
    const endDate = new Date('2025-12-05T10:00:00.000Z');

    await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        endDate: endDate.toISOString()
        // startDate omitida intencionalmente
      })
      .expect(400);
  });

  it('POST /properties/:propertyId/bookings - deve retornar 400 quando endDate não for fornecida', async () => {
    const startDate = new Date('2025-12-01T10:00:00.000Z');

    await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        startDate: startDate.toISOString()
        // endDate omitida intencionalmente
      })
      .expect(400);
  });

  it('POST /properties/:propertyId/bookings - deve retornar 404 quando propriedade não existir', async () => {
    const startDate = new Date('2025-12-01T10:00:00.000Z');
    const endDate = new Date('2025-12-05T10:00:00.000Z');
    const nonExistentPropertyId = '00000000-0000-0000-0000-000000000000';

    await request(app.getHttpServer())
      .post(`/properties/${nonExistentPropertyId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .expect(404);
  });

  it('POST /properties/:propertyId/bookings - deve retornar 401 quando não autenticado', async () => {
    const startDate = new Date('2025-12-01T10:00:00.000Z');
    const endDate = new Date('2025-12-05T10:00:00.000Z');

    await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      // Sem header Authorization
      .send({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .expect(401);
  });

  it('POST /properties/:propertyId/bookings - deve criar múltiplos bloqueios para a mesma propriedade', async () => {
    // Primeiro bloqueio
    const startDate1 = new Date('2025-12-01T10:00:00.000Z');
    const endDate1 = new Date('2025-12-05T10:00:00.000Z');

    const res1 = await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        startDate: startDate1.toISOString(),
        endDate: endDate1.toISOString()
      })
      .expect(201);

    // Segundo bloqueio (período diferente)
    const startDate2 = new Date('2025-12-10T10:00:00.000Z');
    const endDate2 = new Date('2025-12-15T10:00:00.000Z');

    const res2 = await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        startDate: startDate2.toISOString(),
        endDate: endDate2.toISOString()
      })
      .expect(201);

    expect(res1.body.id).not.toBe(res2.body.id);
    expect(res1.body.propertyId).toBe(propertyAId);
    expect(res2.body.propertyId).toBe(propertyAId);
  });

  it('POST /properties/:propertyId/bookings - deve aceitar tipo RESERVATION explicitamente', async () => {
    const startDate = new Date('2025-12-01T10:00:00.000Z');
    const endDate = new Date('2025-12-05T10:00:00.000Z');

    const res = await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type: 'RESERVATION'
      })
      .expect(201);

    expect(res.body.type).toBe('RESERVATION');
    expect(res.body.propertyId).toBe(propertyAId);
  });
});
