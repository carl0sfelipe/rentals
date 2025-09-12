import 'reflect-metadata';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { INestApplication, Module, Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req, UnauthorizedException, Inject, HttpCode } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthService } from '../src/auth/auth.service';
import { PropertiesService } from '../src/properties/properties.service';

// Memória simples
const users: any[] = []; // {id,email,password}
const properties: any[] = []; // {id,title,ownerId}

class PrismaMock {
  user = {
    findUnique: async ({ where: { email } }: any) => users.find((u) => u.email === email) || null,
    create: async ({ data }: any) => { const nu = { id: String(users.length + 1), ...data }; users.push(nu); return nu; },
  };
  property = {
    create: async ({ data }: any) => { const np = { id: String(properties.length + 1), ...data }; properties.push(np); return np; },
    findUnique: async ({ where: { id } }: any) => properties.find((p) => p.id === id) || null,
    update: async ({ where: { id }, data }: any) => { const i = properties.findIndex((p) => p.id === id); if (i === -1) return null; properties[i] = { ...properties[i], ...data }; return properties[i]; },
    delete: async ({ where: { id } }: any) => { const i = properties.findIndex((p) => p.id === id); if (i === -1) return null; return properties.splice(i,1)[0]; },
  };
}
class JwtMock { async signAsync(payload: any) { return `token-${payload.sub}`; } }

// Auth guard simples lendo Authorization: Bearer token-<id>
function extractUserIdFromAuth(header?: string) {
  if (!header) return null;
  const parts = header.split(' ');
  if (parts.length !== 2) return null;
  const token = parts[1];
  if (!token.startsWith('token-')) return null;
  return token.replace('token-', '');
}

class AuthGuardMock {
  canActivate(ctx: any) {
    const req = ctx.switchToHttp().getRequest();
    const userId = extractUserIdFromAuth(req.headers['authorization']);
    if (!userId) throw new UnauthorizedException(); // garante 401
    req.user = { id: userId };
    return true;
  }
}

@Controller('auth')
class AuthControllerMock {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Post('register') register(@Body() body: any) { return this.auth.register(body); }
  @Post('login') @HttpCode(200) async login(@Body() body: any) { return this.auth.login(body); }
}

@Controller('properties')
class PropertiesControllerMock {
  constructor(@Inject(PropertiesService) private readonly service: PropertiesService) {}

  @UseGuards(AuthGuardMock)
  @Post()
  create(@Req() req: any, @Body() body: any) { return this.service.create(req.user.id, body); }

  @UseGuards(AuthGuardMock)
  @Get(':id')
  get(@Req() req: any, @Param('id') id: string) { return this.service.findOne(req.user.id, id); }

  @UseGuards(AuthGuardMock)
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() body: any) { return this.service.update(req.user.id, id, body); }

  @UseGuards(AuthGuardMock)
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) { return this.service.remove(req.user.id, id); }
}

@Module({
  controllers: [AuthControllerMock, PropertiesControllerMock],
  providers: [
    { provide: 'PrismaService', useClass: PrismaMock },
    { provide: 'JwtService', useClass: JwtMock },
    AuthService,
    PropertiesService,
  ],
})
class TestAppModule {}

describe('Properties E2E', () => {
  let app: INestApplication;
  let server: any;
  let tokenA: string;
  let tokenB: string;
  let propertyId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestAppModule] }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    server = app.getHttpServer();

    // Cria usuários e loga
    await request(server).post('/auth/register').send({ email: 'a@test.com', password: 'a' }).expect(201);
    const loginA = await request(server).post('/auth/login').send({ email: 'a@test.com', password: 'a' }).expect(200);
    tokenA = loginA.body.access_token;

    await request(server).post('/auth/register').send({ email: 'b@test.com', password: 'b' }).expect(201);
    const loginB = await request(server).post('/auth/login').send({ email: 'b@test.com', password: 'b' }).expect(200);
    tokenB = loginB.body.access_token;
  });

  afterAll(async () => { await app.close(); });

  it('endpoints requerem auth (401 sem token)', async () => {
    await request(server).post('/properties').send({ title: 'Sem token' }).expect(401);
    await request(server).get('/properties/1').expect(401);
    await request(server).patch('/properties/1').send({ title: 'x' }).expect(401);
    await request(server).delete('/properties/1').expect(401);
  });

  it('CRUD completo com usuário A', async () => {
    // Create
    const createRes = await request(server)
      .post('/properties')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Casa A' })
      .expect(201);
    propertyId = createRes.body.id;
    expect(createRes.body.ownerId).toBe('1');

    // Read
    const getRes = await request(server)
      .get(`/properties/${propertyId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(getRes.body.id).toBe(propertyId);

    // Update
    const patchRes = await request(server)
      .patch(`/properties/${propertyId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Casa A+' })
      .expect(200);
    expect(patchRes.body.title).toBe('Casa A+');

    // Delete
    const delRes = await request(server)
      .delete(`/properties/${propertyId}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(delRes.body).toEqual({ deleted: true });
  });

  it('Usuário B não pode acessar propriedade de A (403)', async () => {
    // Recria com A
    const createRes = await request(server)
      .post('/properties')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Casa A2' })
      .expect(201);
    const propId = createRes.body.id;

    await request(server)
      .get(`/properties/${propId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);

    await request(server)
      .patch(`/properties/${propId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ title: 'Hack' })
      .expect(403);

    await request(server)
      .delete(`/properties/${propId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(403);
  });
});
