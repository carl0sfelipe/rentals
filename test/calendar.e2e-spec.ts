import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Calendar E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // Variáveis para os testes
  let userAToken: string;
  let userBToken: string;
  let userAEmail: string;
  let userBEmail: string;
  let propertyAId: string;
  let propertyBId: string;
  let bookingBlockedId: string;
  let bookingReservationId: string;

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
    await prisma.booking.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    // Limpar dados de teste na ordem correta - bookings primeiro, depois properties, depois users
    await prisma.booking.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});
    await app.close();
  });

  beforeEach(async () => {
    // Pequeno delay para evitar conflitos de timestamp
    await new Promise(resolve => setTimeout(resolve, 20));
    
    // Limpar dados antes de cada teste
    await prisma.booking.deleteMany({});
    await prisma.property.deleteMany({});
    await prisma.user.deleteMany({});

    // Setup inicial: criar dois usuários
    const timestamp = Date.now();
    const randomId = Math.floor(Math.random() * 10000);
    const testPrefix = `calendar-${timestamp}-${randomId}`;
    userAEmail = `userA-${testPrefix}@test.com`;
    userBEmail = `userB-${testPrefix}@test.com`;

    // Registrar User A
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: userAEmail, password: 'password123', name: 'User A Calendar' })
      .expect(201);

    // Registrar User B
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: userBEmail, password: 'password123', name: 'User B Calendar' })
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

        // Criar propriedade A
    const propertyARes = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: 'Casa de Praia - Calendar Test',
        description: 'Uma casa à beira mar para testes de calendário',
        address: 'Rua das Ondas, 123, Florianópolis, SC, Brasil',
        pricePerNight: 150.00,
        bedrooms: 3,
        bathrooms: 2
      })
      .expect(201);
    propertyAId = propertyARes.body.id;

    // Criar propriedade B (sem bookings)
    const propertyBRes = await request(app.getHttpServer())
      .post('/properties')
      .set('Authorization', `Bearer ${userBToken}`)
      .send({
        title: 'Apartamento Centro - Calendar Test',
        description: 'Apartamento no centro para testes de calendário',
        address: 'Rua do Comércio, 456, São Paulo, SP, Brasil',
        pricePerNight: 200.00,
        bedrooms: 2,
        bathrooms: 1
      })
      .expect(201);
    propertyBId = propertyBRes.body.id;

    // Criar bookings para Property A
    const startDateBlocked = new Date('2025-12-15T10:00:00.000Z');
    const endDateBlocked = new Date('2025-12-20T10:00:00.000Z');

    const bookingBlockedRes = await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'BLOCKED',
        startDate: startDateBlocked.toISOString(),
        endDate: endDateBlocked.toISOString()
      })
      .expect(201);
    bookingBlockedId = bookingBlockedRes.body.id;

    const startDateReservation = new Date('2025-12-25T14:00:00.000Z');
    const endDateReservation = new Date('2025-12-30T11:00:00.000Z');

    const bookingReservationRes = await request(app.getHttpServer())
      .post(`/properties/${propertyAId}/bookings`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        type: 'RESERVATION',
        startDate: startDateReservation.toISOString(),
        endDate: endDateReservation.toISOString()
      })
      .expect(201);
    bookingReservationId = bookingReservationRes.body.id;
  });

  it('GET /properties/:propertyId/calendar.ics - deve retornar calendário iCalendar com bookings', async () => {
    const res = await request(app.getHttpServer())
      .get(`/properties/${propertyAId}/calendar.ics`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    // Verificar Content-Type
    expect(res.headers['content-type']).toBe('text/calendar; charset=utf-8');

    const calendarContent = res.text;

    // Verificar estrutura básica do iCalendar
    expect(calendarContent).toContain('BEGIN:VCALENDAR');
    expect(calendarContent).toContain('VERSION:2.0');
    expect(calendarContent).toContain('PRODID:-//SuaEmpresa//SeuApp//PT');
    expect(calendarContent).toContain('END:VCALENDAR');

    // Verificar se contém dois eventos
    const eventMatches = calendarContent.match(/BEGIN:VEVENT/g);
    expect(eventMatches).toBeTruthy();
    expect(eventMatches?.length).toBe(2);

    // Verificar se contém os dois tipos de booking
    expect(calendarContent).toContain('SUMMARY:BLOQUEADO');
    expect(calendarContent).toContain('SUMMARY:RESERVA');

    // Verificar se contém datas de início e fim
    expect(calendarContent).toContain('DTSTART;VALUE=DATE:');
    expect(calendarContent).toContain('DTEND;VALUE=DATE:');

    // Verificar se contém fechamento dos eventos
    const eventEndMatches = calendarContent.match(/END:VEVENT/g);
    expect(eventEndMatches).toBeTruthy();
    expect(eventEndMatches?.length).toBe(2);

    // Verificar formato das datas (deve estar em formato de data apenas para eventos de dia inteiro)
    expect(calendarContent).toContain('DTSTART;VALUE=DATE:20251215');
    expect(calendarContent).toContain('DTEND;VALUE=DATE:20251220');
    expect(calendarContent).toContain('DTSTART;VALUE=DATE:20251225');
    expect(calendarContent).toContain('DTEND;VALUE=DATE:20251230');
  });

  it('GET /properties/:propertyId/calendar.ics - deve retornar calendário vazio quando não há bookings', async () => {
    const res = await request(app.getHttpServer())
      .get(`/properties/${propertyBId}/calendar.ics`)
      .set('Authorization', `Bearer ${userBToken}`)
      .expect(200);

    // Verificar Content-Type
    expect(res.headers['content-type']).toBe('text/calendar; charset=utf-8');

    const calendarContent = res.text;

    // Verificar estrutura básica do iCalendar
    expect(calendarContent).toContain('BEGIN:VCALENDAR');
    expect(calendarContent).toContain('VERSION:2.0');
    expect(calendarContent).toContain('PRODID:-//SuaEmpresa//SeuApp//PT');
    expect(calendarContent).toContain('END:VCALENDAR');

    // Verificar que NÃO contém eventos
    expect(calendarContent).not.toContain('BEGIN:VEVENT');
    expect(calendarContent).not.toContain('END:VEVENT');
    expect(calendarContent).not.toContain('SUMMARY:');
    expect(calendarContent).not.toContain('DTSTART:');
    expect(calendarContent).not.toContain('DTEND:');
  });

  it('GET /properties/:propertyId/calendar.ics - deve retornar 404 para propriedade inexistente', async () => {
    const fakePropertyId = '12345678-1234-1234-1234-123456789012';
    
    await request(app.getHttpServer())
      .get(`/properties/${fakePropertyId}/calendar.ics`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(404);
  });

  it('GET /properties/:propertyId/calendar.ics - deve retornar 403 ao tentar acessar calendário de propriedade de outro usuário', async () => {
    // User A tentando acessar calendário da Property B (que é do User B)
    await request(app.getHttpServer())
      .get(`/properties/${propertyBId}/calendar.ics`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(403);
  });

  it('GET /properties/:propertyId/calendar.ics - deve retornar 401 quando não autenticado', async () => {
    await request(app.getHttpServer())
      .get(`/properties/${propertyAId}/calendar.ics`)
      .expect(401);
  });

  it('GET /properties/:propertyId/calendar.ics - deve gerar UIDs únicos para cada evento', async () => {
    const res = await request(app.getHttpServer())
      .get(`/properties/${propertyAId}/calendar.ics`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    const calendarContent = res.text;

    // Extrair todos os UIDs
    const uidMatches = calendarContent.match(/UID:([^\r\n]+)/g);
    expect(uidMatches).toBeTruthy();
    expect(uidMatches?.length).toBe(2);

    // Verificar se os UIDs são diferentes
    const uid1 = uidMatches?.[0];
    const uid2 = uidMatches?.[1];
    expect(uid1).not.toBe(uid2);

    // Verificar formato básico do UID (deve conter o ID do booking)
    expect(uid1).toContain(bookingBlockedId);
    expect(uid2).toContain(bookingReservationId);
  });

  it('GET /properties/:propertyId/calendar.ics - deve incluir informações de propriedade no calendário', async () => {
    const res = await request(app.getHttpServer())
      .get(`/properties/${propertyAId}/calendar.ics`)
      .set('Authorization', `Bearer ${userAToken}`)
      .expect(200);

    const calendarContent = res.text;

    // Verificar se inclui informações da propriedade nos eventos
    expect(calendarContent).toContain('LOCATION:');
    expect(calendarContent).toContain('Casa de Praia - Calendar Test');
    
    // Verificar se os eventos têm descrição
    expect(calendarContent).toContain('DESCRIPTION:');
  });
});
