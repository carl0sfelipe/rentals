import { ConflictException, Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationRole } from '@prisma/client';
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
    private prisma: PrismaService,
    private jwt: JwtService,
    @Inject('PasswordHasher') private hasher: PasswordHasher,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const hashed = await this.hasher.hash(dto.password);
      
      // Create user and organization in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        // Create the user
        const user = await tx.user.create({
          data: { email: dto.email, password: hashed, name: dto.name }
        });

        // Create organization for the user (Org-Lite: each user gets their own org)
        const organization = await tx.organization.create({
          data: {
            name: `${dto.name}'s Organization`,
            slug: `${dto.email.split('@')[0]}-${Date.now()}`, // Simple slug generation
          }
        });

        // Add user as PROPRIETARIO of their organization (owner of their own org)
        await tx.organizationUser.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            role: 'PROPRIETARIO' as OrganizationRole
          }
        });

        // Update user's activeOrganizationId
        await tx.user.update({
          where: { id: user.id },
          data: { activeOrganizationId: organization.id }
        });

        return { user, organization };
      });

      return { 
        access_token: await this.jwt.signAsync({ 
          sub: result.user.id, 
          email: result.user.email,
          activeOrganizationId: result.organization.id
        }) 
      };
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
    
    // Get user's primary organization
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
  }
}
