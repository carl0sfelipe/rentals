import { Module } from '@nestjs/common';
import { AuthService, PBKDF2Hasher } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AuthController],
  providers: [
    PrismaService,
    { provide: 'PrismaService', useExisting: PrismaService },
    AuthService,
    PBKDF2Hasher,
    { provide: 'PasswordHasher', useExisting: PBKDF2Hasher },
    { provide: 'JwtService', useValue: { signAsync: async (payload: any) => `signed-jwt-token` } },
  ],
  exports: [AuthService],
})
export class AuthModule {}
