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

    // Limpar banco antes de começar
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
  });

  // Remover beforeEach para evitar conflitos entre testes paralelos

  afterAll(async () => {
    // Limpar dados de teste na ordem correta - bookings primeiro, depois properties, depois users
    await (prisma as any).booking.deleteMany({});
    await (prisma as any).property.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  it('POST /properties - deve criar uma nova propriedade para um usuário autenticado', async () => {
    const res = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${userAToken}`)
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
    
    // Guardar o ID para testes posteriores
    propertyAId = res.body.id;
  });

  it('POST /properties - deve criar uma segunda propriedade para User A', async () => {
    const res = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Apartamento Centro',
        description: 'Apartamento no centro da cidade',
        address: 'Rua Central, 456',
        pricePerNight: 200.0,
        bedrooms: 2,
        bathrooms: 1
      })
      .expect(201);

    expect(res.body).toMatchObject({
      title: 'Apartamento Centro',
      description: 'Apartamento no centro da cidade',
      address: 'Rua Central, 456',
      pricePerNight: 200.0,
      bedrooms: 2,
      bathrooms: 1
    });
    expect(res.body.id).toBeDefined();
  });

  it('POST /properties - deve criar uma propriedade para User B', async () => {
    const res = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        title: 'Casa de Campo',
        description: 'Uma casa aconchegante no campo',
        address: 'Estrada do Campo, 789',
        pricePerNight: 120.0,
        bedrooms: 4,
        bathrooms: 3
      })
      .expect(201);

    expect(res.body).toMatchObject({
      title: 'Casa de Campo',
      description: 'Uma casa aconchegante no campo',
      address: 'Estrada do Campo, 789',
      pricePerNight: 120.0,
      bedrooms: 4,
      bathrooms: 3
    });
    expect(res.body.id).toBeDefined();
    
    // Guardar o ID para testes posteriores
    propertyBId = res.body.id;
  });

  it('GET /properties - deve retornar apenas as propriedades do usuário autenticado', async () => {
    const res = await request(app.getHttpServer())
      .get('/properties')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    expect(res.body).toHaveLength(2);
    expect(res.body.every((property: any) => 
      property.title === 'Casa de Praia' || property.title === 'Apartamento Centro'
    )).toBe(true);
  });

  it('GET /properties - User B deve ver apenas sua própria propriedade', async () => {
    const res = await request(app.getHttpServer())
      .get('/properties')
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Casa de Campo');
  });

  it('GET /properties/:id - deve retornar detalhes da propriedade própria', async () => {
    const res = await request(app.getHttpServer())
      .get(`/properties/${propertyAId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    expect(res.body).toMatchObject({
      id: propertyAId,
      title: 'Casa de Praia',
      description: 'Uma bela casa na praia',
      address: 'Rua da Praia, 123',
      pricePerNight: 150.0,
      bedrooms: 3,
      bathrooms: 2
    });
  });

  it('GET /properties/:id - deve retornar 403 ao tentar acessar propriedade de outro usuário', async () => {
    await request(app.getHttpServer())
      .get(`/properties/${propertyBId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(403);
  });

  it('PATCH /properties/:id - deve atualizar propriedade própria com sucesso', async () => {
    const updateData = {
      title: 'Casa de Praia Renovada',
      pricePerNight: 180.0
    };

    const res = await request(app.getHttpServer())
      .patch(`/properties/${propertyAId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send(updateData)
      .expect(200);

    expect(res.body).toMatchObject({
      id: propertyAId,
      title: 'Casa de Praia Renovada',
      pricePerNight: 180.0,
      description: 'Uma bela casa na praia', // Deve manter dados não alterados
      address: 'Rua da Praia, 123',
      bedrooms: 3,
      bathrooms: 2
    });
  });

  it('PATCH /properties/:id - deve retornar 403 ao tentar atualizar propriedade de outro usuário', async () => {
    const updateData = {
      title: 'Tentativa de Hack',
      pricePerNight: 1.0
    };

    await request(app.getHttpServer())
      .patch(`/properties/${propertyBId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send(updateData)
      .expect(403);
  });

  it('DELETE /properties/:id - deve retornar 403 ao tentar deletar propriedade de outro usuário', async () => {
    await request(app.getHttpServer())
      .delete(`/properties/${propertyBId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(403);
  });

  it('DELETE /properties/:id - deve deletar propriedade própria com sucesso', async () => {
    await request(app.getHttpServer())
      .delete(`/properties/${propertyAId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200); // ou 204, dependendo da implementação

    // Verificar se a propriedade foi realmente deletada
    await request(app.getHttpServer())
      .get(`/properties/${propertyAId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(404);
  });

  it('GET /properties - User A deve ter apenas 1 propriedade após deletar uma', async () => {
    const res = await request(app.getHttpServer())
      .get('/properties')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Apartamento Centro');
  });

  it('GET /properties - User B ainda deve ter sua propriedade intacta', async () => {
    const res = await request(app.getHttpServer())
      .get('/properties')
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Casa de Campo');
  });
});
