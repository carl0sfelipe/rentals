import { ConflictException, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import * as crypto from 'crypto';

export class RegisterDto { email!: string; password!: string; }
export class LoginDto { email!: string; password!: string; }

// Strategy interface
export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}

// Default PBKDF2 implementation
@Injectable()
export class PBKDF2Hasher implements PasswordHasher {
  async hash(plain: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(plain, salt, 1000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }
  async compare(plain: string, stored: string): Promise<boolean> {
    if (!stored.includes(':')) return stored === `hashed:${plain}`;
    const [salt, hash] = stored.split(':');
    const verify = crypto.pbkdf2Sync(plain, salt, 1000, 64, 'sha512').toString('hex');
    return hash === verify;
  }
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('PrismaService') private readonly prisma: any,
    @Inject('JwtService') private readonly jwt: any,
    @Inject('PasswordHasher') private readonly hasher: PasswordHasher,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already in use');

    const hashed = await this.hasher.hash(dto.password);
    try {
      // Retorna apenas campos seguros
      return await this.prisma.user.create({
        data: { email: dto.email, password: hashed },
        select: { id: true, email: true },
      });
    } catch (err: any) {
      // Prisma unique constraint (race condition)
      if (err?.code === 'P2002') throw new ConflictException('Email already in use');
      throw err;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await this.hasher.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    return { access_token: await this.jwt.signAsync({ sub: user.id, email: user.email }) };
  }
}
