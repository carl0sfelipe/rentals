import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { UnsplashService } from '../unsplash/unsplash.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService, UnsplashService],
})
export class PropertiesModule {}
