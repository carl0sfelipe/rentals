import { Controller, Post, Body, Param, Request, UseGuards, Inject } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './bookings.dto';

@Controller('properties/:propertyId/bookings')
@UseGuards(JwtAuthGuard)
export class BookingsController {
  constructor(@Inject(BookingsService) private bookingsService: BookingsService) {
    console.log('BookingsController initialized');
  }

  @Post()
  async create(@Request() req: any, @Param('propertyId') propertyId: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto, req.user.id, propertyId);
  }
}
