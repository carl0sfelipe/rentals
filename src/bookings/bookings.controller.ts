import { Controller, Post, Body, Param, Request, UseGuards, Inject, Get, Patch, Delete } from '@nestjs/common';
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

  @Get()
  async findAll(@Request() req: any, @Param('propertyId') propertyId: string) {
    return this.bookingsService.findAllByProperty(propertyId, req.user.id);
  }

  @Patch(':id')
  async update(@Request() req: any, @Param('propertyId') propertyId: string, @Param('id') id: string, @Body() dto: CreateBookingDto) {
    return this.bookingsService.update(id, dto, req.user.id, propertyId);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('propertyId') propertyId: string, @Param('id') id: string) {
    return this.bookingsService.remove(id, req.user.id, propertyId);
  }
}
