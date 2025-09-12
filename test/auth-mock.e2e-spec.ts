import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AuthController } from '../src/auth/auth.controller';
import { AuthService } from '../src/auth/auth.service';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock service
const mockAuthService = {
  register: vi.fn().mockImplementation((dto: any) => ({
    id: 1,
    email: dto.email,
  })),
  login: vi.fn().mockImplementation(() => ({
    access_token: 'mock-token',
  })),
};

describe('AuthController E2E Mock', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  it('POST /auth/register deve criar usuário (201)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'test@example.com', password: 'password123', name: 'Test User' })
      .expect(201);
    
    expect(res.body).toMatchObject({ email: 'test@example.com' });
    expect(mockAuthService.register).toHaveBeenCalledWith({ 
      email: 'test@example.com', 
      password: 'password123',
      name: 'Test User'
    });
  });

  it('POST /auth/login deve retornar token (200)', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .expect(200);
    
    expect(res.body.access_token).toBe('mock-token');
    expect(mockAuthService.login).toHaveBeenCalledWith({ 
      email: 'test@example.com', 
      password: 'password123' 
    });
  });
});
