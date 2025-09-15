import { ConflictException, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationRole } from '@prisma/client';
import { isMultiTenantEnabled } from '../config/feature-flags';
import * as crypto from 'crypto';

export class RegisterDto { email!: string; password!: string; name!: string; }
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
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    @Inject('PasswordHasher') private readonly hasher: PasswordHasher
  ) {}

  async register(dto: RegisterDto) {
    try {
      const hashed = await this.hasher.hash(dto.password);
      
      // Simplified single-tenant only approach
      const user = await this.prisma.user.create({
        data: { email: dto.email, password: hashed, name: dto.name }
      });

      const result = { 
        access_token: await this.jwt.signAsync({ 
          sub: user.id, 
          email: user.email
        }),
        id: user.id,
        email: user.email,
        name: user.name
      };

      return result;
    } catch (err: any) {
      // Prisma unique constraint (race condition)
      if (err?.code === 'P2002') throw new ConflictException('Email already in use');
      throw err;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ 
      where: { email: dto.email }
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    
    const valid = await this.hasher.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    
    if (isMultiTenantEnabled()) {
      // Get user's primary organization (MULTI-TENANT MODE)
      const userOrg = await this.prisma.organizationUser.findFirst({
        where: { userId: user.id },
        include: { organization: true }
      });
      
      const activeOrganizationId = userOrg?.organizationId || null;

      return { 
        access_token: await this.jwt.signAsync({ 
          sub: user.id, 
          email: user.email,
          activeOrganizationId
        }) 
      };
    } else {
      // Simple login (SINGLE-TENANT MODE)
      return { 
        access_token: await this.jwt.signAsync({ 
          sub: user.id, 
          email: user.email
        }) 
      };
    }
  }
}
