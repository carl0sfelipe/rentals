import 'reflect-metadata';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { PropertiesService } from '../src/properties/properties.service';
import { UnsplashService } from '../src/unsplash/unsplash.service';

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
    
    // MANUAL DEPENDENCY INJECTION FIX for E2E tests
    // In Vitest E2E environment, service dependencies are injecting as undefined
    // This is a workaround to manually patch the services after module compilation
    const authService = moduleRef.get<AuthService>(AuthService);
    const jwtService = moduleRef.get<JwtService>(JwtService);
    const propertiesService = moduleRef.get<PropertiesService>(PropertiesService);
    const unsplashService = moduleRef.get<UnsplashService>(UnsplashService);
    
    // Manually assign the dependencies
    (authService as any).prisma = prisma;
    (authService as any).jwt = jwtService;
    (propertiesService as any).prisma = prisma;
    (propertiesService as any).unsplashService = unsplashService;
  });

  beforeEach(async () => {
    // Pequeno delay para evitar conflitos de timestamp
    await new Promise(resolve => setTimeout(resolve, 10));
    
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

  // Helper para setup de usuários em cada teste
  const setupUsers = async () => {
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);
    const testPrefix = `props-${timestamp}-${randomId}`;
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

    return { userAEmail, userBEmail, userAToken, userBToken };
  };

  it('POST /properties - deve criar uma nova propriedade para um usuário autenticado', async () => {
    const { userAToken } = await setupUsers();

    const res = await request(app.getHttpServer())
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

    expect(res.body).toMatchObject({
      title: 'Casa de Praia',
      description: 'Uma bela casa na praia',
      address: 'Rua das Palmeiras, 123',
      pricePerNight: 250.00,
      bedrooms: 3,
      bathrooms: 2
    });
    expect(res.body.id).toBeDefined();
  });

  it('POST /properties - deve criar múltiplas propriedades para usuários diferentes', async () => {
    const { userAToken, userBToken } = await setupUsers();

    // User A cria duas propriedades
    const propA1 = await request(app.getHttpServer())
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

    const propA2 = await request(app.getHttpServer())
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

    // User B cria uma propriedade
    const propB1 = await request(app.getHttpServer())
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

    // User A deve ver apenas suas propriedades
    const resA = await request(app.getHttpServer())
      .get('/properties')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    expect(resA.body).toHaveLength(2);
    expect(resA.body.every((property: any) => 
      property.title === 'Casa de Praia' || property.title === 'Apartamento Centro'
    )).toBe(true);

    // User B deve ver apenas sua propriedade
    const resB = await request(app.getHttpServer())
      .get('/properties')
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(200);

    expect(resB.body).toHaveLength(1);
    expect(resB.body[0].title).toBe('Casa de Campo');
  });

  it('GET /properties/:id - deve permitir acesso apenas ao dono', async () => {
    const { userAToken, userBToken } = await setupUsers();

    // User A cria uma propriedade
    const propRes = await request(app.getHttpServer())
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

    // User A pode acessar sua própria propriedade
    const res = await request(app.getHttpServer())
      .get(`/properties/${propertyId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    expect(res.body.title).toBe('Casa Teste');

    // User B não pode acessar propriedade de User A
    await request(app.getHttpServer())
      .get(`/properties/${propertyId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(403);
  });

  it('PATCH /properties/:id - deve permitir atualização apenas pelo dono', async () => {
    const { userAToken, userBToken } = await setupUsers();

    // User A cria uma propriedade
    const propRes = await request(app.getHttpServer())
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

    // User A pode atualizar sua propriedade
    const res = await request(app.getHttpServer())
      .patch(`/properties/${propertyId}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send(updateData)
      .expect(200);

    expect(res.body).toMatchObject({
      title: 'Casa Atualizada',
      description: 'Descrição atualizada',
      pricePerNight: 150.00
    });

    // User B não pode atualizar propriedade de User A
    await request(app.getHttpServer())
      .patch(`/properties/${propertyId}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .send(updateData)
      .expect(403);
  });

  it('DELETE /properties/:id - deve permitir exclusão apenas pelo dono', async () => {
    const { userAToken, userBToken } = await setupUsers();

    // User A cria duas propriedades
    const prop1 = await request(app.getHttpServer())
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

    const prop2 = await request(app.getHttpServer())
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

    // User B não pode deletar propriedade de User A
    await request(app.getHttpServer())
      .delete(`/properties/${prop1.body.id}`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(403);

    // User A pode deletar sua própria propriedade
    await request(app.getHttpServer())
      .delete(`/properties/${prop1.body.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    // Verificar se a propriedade foi realmente deletada
    await request(app.getHttpServer())
      .get(`/properties/${prop1.body.id}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(404);

    // User A ainda deve ter a segunda propriedade
    const res = await request(app.getHttpServer())
      .get('/properties')
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].title).toBe('Casa 2');
  });
});
