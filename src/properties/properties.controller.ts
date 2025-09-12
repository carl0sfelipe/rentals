import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Inject, Res, HttpException, HttpStatus } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class PropertiesController {
  constructor(@Inject(PropertiesService) private readonly propertiesService: PropertiesService) {}

  @Post()
  create(@Req() req: any, @Body() createPropertyDto: any) {
    return this.propertiesService.create(req.user.id, createPropertyDto);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.propertiesService.findAll(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.propertiesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() updatePropertyDto: any) {
    return this.propertiesService.update(req.user.id, id, updatePropertyDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    return this.propertiesService.remove(req.user.id, id);
  }

  @Get(':id/calendar.ics')
  async getCalendar(@Req() req: any, @Param('id') id: string, @Res() res: Response) {
    try {
      const calendar = await this.propertiesService.getCalendar(req.user.id, id);
      
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="property-${id}-calendar.ics"`);
      
      return res.send(calendar);
    } catch (error: any) {
      if (error.message === 'Property not found') {
        throw new HttpException('Property not found', HttpStatus.NOT_FOUND);
      }
      if (error.message === 'Access denied') {
        throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
      }
      throw error;
    }
  }
}
