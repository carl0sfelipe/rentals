import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [HealthController],
  providers: [PrismaService, { provide: 'PrismaService', useExisting: PrismaService }],
})
export class HealthModule {}
