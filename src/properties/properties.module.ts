import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
