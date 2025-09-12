import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './bookings.dto';

@Injectable()
export class BookingsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    console.log('BookingsService initialized');
  }

  async create(createBookingDto: CreateBookingDto, userId: string, propertyId: string) {
    // Validar campos obrigatórios
    if (!createBookingDto.startDate) {
      throw new BadRequestException('Data de início é obrigatória');
    }

    if (!createBookingDto.endDate) {
      throw new BadRequestException('Data de fim é obrigatória');
    }

    // Verificar se as datas são válidas
    const startDate = new Date(createBookingDto.startDate);
    const endDate = new Date(createBookingDto.endDate);
    
    if (isNaN(startDate.getTime())) {
      throw new BadRequestException('Data de início inválida');
    }

    if (isNaN(endDate.getTime())) {
      throw new BadRequestException('Data de fim inválida');
    }

    // Verificar se startDate é anterior a endDate
    if (startDate >= endDate) {
      throw new BadRequestException('Data de início deve ser anterior à data de fim');
    }

    // Verificar se a propriedade existe
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      throw new NotFoundException('Propriedade não encontrada');
    }

    // Verificar se o usuário é dono da propriedade
    if (property.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para criar bookings nesta propriedade');
    }

    // Se tudo estiver certo, criar o novo Booking
    const booking = await (this.prisma as any).booking.create({
      data: {
        startDate,
        endDate,
        type: createBookingDto.type || 'BLOCKED',
        propertyId: propertyId
      }
    });

    return booking;
  }
}
