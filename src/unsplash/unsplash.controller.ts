import { Controller, Get, Query } from '@nestjs/common';
import { UnsplashService } from './unsplash.service';

@Controller('unsplash')
export class UnsplashController {
  constructor(private readonly unsplashService: UnsplashService) {}

  @Get('random')
  getRandomImage(
    @Query('width') width?: string,
    @Query('height') height?: string,
  ): { imageUrl: string } {
    const w = width ? parseInt(width) : 800;
    const h = height ? parseInt(height) : 600;
    
    return {
      imageUrl: this.unsplashService.getRandomCuratedArchitectureImage(w, h),
    };
  }
}
