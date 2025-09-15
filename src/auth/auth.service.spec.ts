import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { PasswordHasher } from './auth.service';

interface MockUser { id: string; email: string; password: string; }
const mockUsers: MockUser[] = [];

const prismaMock = {
  user: {
    count: vi.fn(async () => mockUsers.length),
    findUnique: vi.fn(async (args: any) => mockUsers.find(u => u.email === args.where.email) || null),
    create: vi.fn(async (args: any) => {
      // Simular erro P2002 se email já existir
      const exists = mockUsers.find(u => u.email === args.data.email);
      if (exists) {
        const error: any = new Error('Unique constraint violation');
        error.code = 'P2002';
        throw error;
      }
      const newUser: MockUser = { id: String(mockUsers.length + 1), ...args.data };
      mockUsers.push(newUser);
      return newUser;
    }),
  },
};

const jwtMock = { signAsync: vi.fn(async () => 'signed-jwt-token') };

const hasherMock: PasswordHasher = {
  hash: vi.fn(async (plain: string) => `hashed:${plain}`),
  compare: vi.fn(async (plain: string, hashed: string) => hashed === `hashed:${plain}`),
};

let service: AuthService;

describe('AuthService (unit)', () => {
  beforeEach(() => {
    mockUsers.length = 0;
    vi.clearAllMocks();
    service = new AuthService(prismaMock as any, jwtMock as any, hasherMock);
  });

  describe('register', () => {
    it('deve criar novo usuário quando email não existe', async () => {
      const res = await (service as any).register({ email: 'a@a.com', password: '123456' });
      expect(res).toHaveProperty('access_token');
      expect(res.access_token).toBe('signed-jwt-token');
      expect((hasherMock.hash as any)).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
    });

    it('deve chamar função de hash de senha', async () => {
      await (service as any).register({ email: 'b@b.com', password: 'secret' });
      expect((hasherMock.hash as any)).toHaveBeenCalledWith('secret');
    });

    it('deve lançar ConflictException se email já estiver em uso', async () => {
      await (service as any).register({ email: 'c@c.com', password: '123' });
      await expect(
        (service as any).register({ email: 'c@c.com', password: '456' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('deve retornar access_token para credenciais válidas', async () => {
      await (service as any).register({ email: 'login@test.com', password: 'pw' });
      vi.clearAllMocks(); // Limpar contadores de mock antes do login
      const res = await (service as any).login({ email: 'login@test.com', password: 'pw' });
      expect(res).toEqual({ access_token: 'signed-jwt-token' });
      expect(jwtMock.signAsync).toHaveBeenCalledTimes(1);
    });

    it('deve lançar UnauthorizedException para email não encontrado', async () => {
      await expect(
        (service as any).login({ email: 'x@x.com', password: 'pw' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('deve lançar UnauthorizedException para senha incorreta', async () => {
      await (service as any).register({ email: 'y@y.com', password: 'correct' });
      await expect(
        (service as any).login({ email: 'y@y.com', password: 'wrong' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
