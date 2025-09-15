import { Module } from '@nestjs/common';
import { OrganizationContextService } from './organization-context.service';
import { OrganizationContextMiddleware } from './organization-context.middleware';
import { OrganizationMembersService } from './invites.service';
import { OrganizationMembersController } from './members.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'development-secret',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [OrganizationMembersController],
  providers: [
    OrganizationContextService,
    OrganizationContextMiddleware,
    OrganizationMembersService,
  ],
  exports: [
    OrganizationContextService,
    OrganizationContextMiddleware,
    OrganizationMembersService,
  ],
})
export class OrganizationsModule {}
