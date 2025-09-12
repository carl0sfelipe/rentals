import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Inject } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
}
