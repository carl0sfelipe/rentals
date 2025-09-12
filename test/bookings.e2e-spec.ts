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
    // Pequeno delay para evitar conflitos de timestamp
    await new Promise(resolve => setTimeout(resolve, 15));
    
    // Limpar banco antes de cada teste para total isolamento
    await prisma.booking.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Limpar dados de teste na ordem correta
    await prisma.booking.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  // Helper para setup de usuários e propriedades
  const setupUsersAndProperty = async () => {
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);
    const testPrefix = `bookings-${timestamp}-${randomId}`;
    const userAEmail = `userA-${testPrefix}@test.com`;
    const userBEmail = `userB-${testPrefix}@test.com`;

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
    const userAToken = loginARes.body.access_token;

    // Login User B
    const loginBRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: userBEmail, password: 'password123' })
      .expect(200);
    const userBToken = loginBRes.body.access_token;

    // User A cria uma propriedade
    const propertyARes = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Casa de Praia User A',
        description: 'Uma bela casa na praia',
        address: 'Rua das Palmeiras, 123',
        pricePerNight: 250.00,
        bedrooms: 3,
        bathrooms: 2
      })
      .expect(201);

    // User B cria uma propriedade
    const propertyBRes = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        title: 'Casa de Campo User B',
        description: 'Casa para relaxar no campo',
        address: 'Estrada Rural, 789',
        pricePerNight: 200.00,
        bedrooms: 4,
        bathrooms: 3
      })
      .expect(201);

    return { 
      userAToken, 
      userBToken, 
      propertyAId: propertyARes.body.id, 
      propertyBId: propertyBRes.body.id 
    };
  };

  it('POST /properties/:propertyId/bookings - deve criar um novo bloqueio com sucesso', async () => {
    const { userAToken, propertyAId } = await setupUsersAndProperty();

    const startDate = new Date('2025-12-20T14:00:00.000Z');
    const endDate = new Date('2025-12-25T11:00:00.000Z');

    const res = await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'BLOCKED',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .expect(201);

    expect(res.body).toMatchObject({
      type: 'BLOCKED',
      propertyId: propertyAId
    });
    expect(res.body.id).toBeDefined();
    expect(new Date(res.body.startDate)).toEqual(startDate);
    expect(new Date(res.body.endDate)).toEqual(endDate);
  });

  it('POST /properties/:propertyId/bookings - deve retornar 403 para propriedade de outro usuário', async () => {
    const { userAToken, propertyBId } = await setupUsersAndProperty();

    const startDate = new Date('2025-12-20T14:00:00.000Z');
    const endDate = new Date('2025-12-25T11:00:00.000Z');

    await request(app.getHttpServer())
      .post(`/properties/${propertyBId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'BLOCKED',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .expect(403);
  });

  it('POST /properties/:propertyId/bookings - deve retornar 400 quando endDate for anterior à startDate', async () => {
    const { userAToken, propertyAId } = await setupUsersAndProperty();

    const startDate = new Date('2025-12-25T14:00:00.000Z');
    const endDate = new Date('2025-12-20T11:00:00.000Z'); // endDate antes de startDate

    await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'BLOCKED',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .expect(400);
  });

  it('POST /properties/:propertyId/bookings - deve retornar 400 quando startDate não for fornecida', async () => {
    const { userAToken, propertyAId } = await setupUsersAndProperty();

    const endDate = new Date('2025-12-25T11:00:00.000Z');

    await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'BLOCKED',
        endDate: endDate.toISOString()
      })
      .expect(400);
  });

  it('POST /properties/:propertyId/bookings - deve retornar 400 quando endDate não for fornecida', async () => {
    const { userAToken, propertyAId } = await setupUsersAndProperty();

    const startDate = new Date('2025-12-20T14:00:00.000Z');

    await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'BLOCKED',
        startDate: startDate.toISOString()
      })
      .expect(400);
  });

  it('POST /properties/:propertyId/bookings - deve retornar 404 quando propriedade não existir', async () => {
    const { userAToken } = await setupUsersAndProperty();

    const fakePropertyId = '00000000-0000-0000-0000-000000000000';
    const startDate = new Date('2025-12-20T14:00:00.000Z');
    const endDate = new Date('2025-12-25T11:00:00.000Z');

    await request(app.getHttpServer())
      .post(`/properties/${fakePropertyId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'BLOCKED',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .expect(404);
  });

  it('POST /properties/:propertyId/bookings - deve retornar 401 quando não autenticado', async () => {
    const { propertyAId } = await setupUsersAndProperty();

    const startDate = new Date('2025-12-20T14:00:00.000Z');
    const endDate = new Date('2025-12-25T11:00:00.000Z');

    await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .send({
        type: 'BLOCKED',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .expect(401);
  });

  it('POST /properties/:propertyId/bookings - deve criar múltiplos bloqueios para a mesma propriedade', async () => {
    const { userAToken, propertyAId } = await setupUsersAndProperty();

    // Primeiro bloqueio
    const booking1 = await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'BLOCKED',
        startDate: '2025-12-01T14:00:00.000Z',
        endDate: '2025-12-05T11:00:00.000Z'
      })
      .expect(201);

    // Segundo bloqueio (sem conflito)
    const booking2 = await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'BLOCKED',
        startDate: '2025-12-10T14:00:00.000Z',
        endDate: '2025-12-15T11:00:00.000Z'
      })
      .expect(201);

    expect(booking1.body.id).toBeDefined();
    expect(booking2.body.id).toBeDefined();
    expect(booking1.body.id).not.toBe(booking2.body.id);
  });

  it('POST /properties/:propertyId/bookings - deve aceitar tipo RESERVATION explicitamente', async () => {
    const { userAToken, propertyAId } = await setupUsersAndProperty();

    const startDate = new Date('2025-12-20T14:00:00.000Z');
    const endDate = new Date('2025-12-25T11:00:00.000Z');

    const res = await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'RESERVATION',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      })
      .expect(201);

    expect(res.body.type).toBe('RESERVATION');
  });
});
