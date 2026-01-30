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

    // Verificar se há conflitos com bookings existentes
    const conflictingBookings = await (this.prisma as any).booking.findMany({
      where: {
        propertyId: propertyId,
        OR: [
          // Novo booking começa durante um período existente
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gt: startDate } }
            ]
          },
          // Novo booking termina durante um período existente
          {
            AND: [
              { startDate: { lt: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          // Novo booking engloba um período existente
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      }
    });

    if (conflictingBookings.length > 0) {
      const conflictDates = conflictingBookings.map((booking: any) => 
        `${booking.startDate.toLocaleDateString('pt-BR')} - ${booking.endDate.toLocaleDateString('pt-BR')}`
      ).join(', ');
      throw new BadRequestException(`Conflito de datas com bookings existentes: ${conflictDates}`);
    }

    // Se tudo estiver certo, criar o novo Booking
    const booking = await this.prisma.booking.create({
      data: {
        startDate,
        endDate,
        type: createBookingDto.type || 'BLOCKED',
        observations: createBookingDto.observations || null,
        guestCount: createBookingDto.guestCount !== undefined ? Number(createBookingDto.guestCount) : 0,
        guestsDetail: createBookingDto.guestsDetail || [],
        propertyId: propertyId
      }
    });

    console.log('✅ Booking created successfully:', JSON.stringify(booking, null, 2));
    return booking;
  }

  async findAllByProperty(propertyId: string, userId: string) {
    // Verificar se a propriedade existe e pertence ao usuário
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      throw new NotFoundException('Propriedade não encontrada');
    }

    if (property.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para ver bookings desta propriedade');
    }

    // Retornar todos os bookings da propriedade
    const bookings = await (this.prisma as any).booking.findMany({
      where: { propertyId: propertyId },
      orderBy: { startDate: 'asc' }
    });

    return bookings;
  }

  async update(id: string, updateBookingDto: CreateBookingDto, userId: string, propertyId: string) {
    // Verificar se o booking existe
    const booking = await (this.prisma as any).booking.findUnique({
      where: { id },
      include: { property: true }
    });

    if (!booking) {
      throw new NotFoundException('Booking não encontrado');
    }

    // Verificar se o booking pertence à propriedade especificada
    if (booking.propertyId !== propertyId) {
      throw new BadRequestException('Booking não pertence a esta propriedade');
    }

    // Verificar se o usuário é dono da propriedade
    if (booking.property.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar este booking');
    }

    // Validar as novas datas se fornecidas
    const startDate = updateBookingDto.startDate ? new Date(updateBookingDto.startDate) : booking.startDate;
    const endDate = updateBookingDto.endDate ? new Date(updateBookingDto.endDate) : booking.endDate;

    if (startDate >= endDate) {
      throw new BadRequestException('Data de início deve ser anterior à data de fim');
    }

    // Verificar se há conflitos com outros bookings (excluindo o próprio booking sendo editado)
    const conflictingBookings = await (this.prisma as any).booking.findMany({
      where: {
        propertyId: propertyId,
        id: { not: id }, // Exclui o booking sendo editado
        OR: [
          // Booking editado começa durante um período existente
          {
            AND: [
              { startDate: { lte: startDate } },
              { endDate: { gt: startDate } }
            ]
          },
          // Booking editado termina durante um período existente
          {
            AND: [
              { startDate: { lt: endDate } },
              { endDate: { gte: endDate } }
            ]
          },
          // Booking editado engloba um período existente
          {
            AND: [
              { startDate: { gte: startDate } },
              { endDate: { lte: endDate } }
            ]
          }
        ]
      }
    });

    if (conflictingBookings.length > 0) {
      const conflictDates = conflictingBookings.map((booking: any) => 
        `${booking.startDate.toLocaleDateString('pt-BR')} - ${booking.endDate.toLocaleDateString('pt-BR')}`
      ).join(', ');
      throw new BadRequestException(`Conflito de datas com bookings existentes: ${conflictDates}`);
    }

    // Atualizar o booking
    const updatedBooking = await (this.prisma as any).booking.update({
      where: { id },
      data: {
        startDate,
        endDate,
        type: updateBookingDto.type || booking.type,
        observations: updateBookingDto.observations !== undefined ? updateBookingDto.observations : booking.observations,
        guestCount: updateBookingDto.guestCount !== undefined ? Number(updateBookingDto.guestCount) : Number(booking.guestCount),
        guestsDetail: updateBookingDto.guestsDetail !== undefined ? updateBookingDto.guestsDetail : booking.guestsDetail,
      }
    });

    return updatedBooking;
  }

  async remove(id: string, userId: string, propertyId: string) {
    // Verificar se o booking existe
    const booking = await (this.prisma as any).booking.findUnique({
      where: { id },
      include: { property: true }
    });

    if (!booking) {
      throw new NotFoundException('Booking não encontrado');
    }

    // Verificar se o booking pertence à propriedade especificada
    if (booking.propertyId !== propertyId) {
      throw new BadRequestException('Booking não pertence a esta propriedade');
    }

    // Verificar se o usuário é dono da propriedade
    if (booking.property.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para deletar este booking');
    }

    // Deletar o booking
    await (this.prisma as any).booking.delete({
      where: { id }
    });

    return { message: 'Booking deletado com sucesso' };
  }
}
