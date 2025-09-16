import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Inject, Res, HttpException, HttpStatus } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Response } from 'express';

@Controller('properties')
export class PropertiesController {
  constructor(@Inject(PropertiesService) private readonly propertiesService: PropertiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() createPropertyDto: any) {
    return this.propertiesService.create(req.user.id, createPropertyDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() req: any) {
    return this.propertiesService.findAll(req.user.id);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.propertiesService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Req() req: any, @Param('id') id: string, @Body() updatePropertyDto: any) {
    return this.propertiesService.update(req.user.id, id, updatePropertyDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Req() req: any, @Param('id') id: string) {
    return this.propertiesService.remove(req.user.id, id);
  }

  @Get(':id/calendar.ics')
  @UseGuards(JwtAuthGuard)
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

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard)
  async publishAd(@Req() req: any, @Param('id') id: string, @Body() scarcityPreferences: any) {
    try {
      const result = await this.propertiesService.publishAd(req.user.id, id, scarcityPreferences);
      return { success: true, publicUrl: result.publicUrl, message: 'Anúncio publicado com sucesso!' };
    } catch (error: any) {
      if (error.message === 'Property not found') {
        throw new HttpException('Propriedade não encontrada', HttpStatus.NOT_FOUND);
      }
      if (error.message === 'Access denied') {
        throw new HttpException('Acesso negado', HttpStatus.FORBIDDEN);
      }
      throw new HttpException('Erro ao publicar anúncio', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':id/unpublish')
  @UseGuards(JwtAuthGuard)
  async unpublishAd(@Req() req: any, @Param('id') id: string) {
    try {
      const result = await this.propertiesService.unpublishAd(req.user.id, id);
      return { success: true, message: 'Anúncio despublicado com sucesso!' };
    } catch (error: any) {
      if (error.message === 'Property not found') {
        throw new HttpException('Propriedade não encontrada', HttpStatus.NOT_FOUND);
      }
      if (error.message === 'Access denied') {
        throw new HttpException('Acesso negado', HttpStatus.FORBIDDEN);
      }
      throw new HttpException('Erro ao despublicar anúncio', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('public/:slug')
  async getPublicAd(@Param('slug') slug: string) {
    try {
      const ad = await this.propertiesService.getPublicAd(slug);
      return ad;
    } catch (error: any) {
      if (error.message === 'Ad not found') {
        throw new HttpException('Anúncio não encontrado', HttpStatus.NOT_FOUND);
      }
      throw new HttpException('Erro ao carregar anúncio', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


}
