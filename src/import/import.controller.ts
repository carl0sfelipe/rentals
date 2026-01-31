import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { IsString, IsOptional } from 'class-validator';

class ParseDto {
  @IsString()
  @IsOptional()
  bookingText?: string;

  @IsString()
  @IsOptional()
  airbnbUpcomingText?: string;

  @IsString()
  @IsOptional()
  airbnbTodayText?: string;
}

@Controller('import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('parse')
  parse(@Body() body: ParseDto) {
    console.log('📥 Recebendo requisição de parse:', {
      bookingLen: body.bookingText?.length,
      airbnbUpLen: body.airbnbUpcomingText?.length,
      airbnbTodayLen: body.airbnbTodayText?.length
    });
    
    try {
      const result = this.importService.parseData(
        body.bookingText || '',
        body.airbnbUpcomingText || '',
        body.airbnbTodayText || ''
      );
      console.log(`✅ Parse concluído. Encontrados: ${result.length} itens.`);
      return result;
    } catch (error) {
      console.error('❌ Erro durante o parse:', error);
      throw error;
    }
  }
}
