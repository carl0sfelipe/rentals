import { Controller, Get, Inject } from '@nestjs/common';

@Controller('health')
export class HealthController {
  constructor(@Inject('PrismaService') private readonly prisma: any) {}

  @Get()
  async check() {
    try {
      await this.prisma.$executeRaw`SELECT 1`;
      return { status: 'ok', db: 'connected' };
    } catch (e) {
      return { status: 'error', db: 'disconnected' };
    }
  }
}
