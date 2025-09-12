import { Module } from '@nestjs/common';
import { AuthService, PBKDF2Hasher } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PBKDF2Hasher,
    { provide: 'PasswordHasher', useExisting: PBKDF2Hasher },
  ],
  exports: [AuthService],
})
export class AuthModule {}
