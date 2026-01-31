import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getTimeline(start: string, end: string, userId: string) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    // Buscamos apenas as propriedades do usuário e seus bookings (reservas/bloqueios)
    const properties = await this.prisma.property.findMany({
      where: {
        userId: userId,
      },
      include: {
        bookings: {
          where: {
            OR: [{ startDate: { lte: endDate }, endDate: { gte: startDate } }],
          },
        },
      },
    });

    // Mapeamos os Bookings para o formato que o componente EventBar do frontend entende
    return properties.map((p) => {
      const events = (p.bookings || []).map((b: any) => {
        // LOG DE AUDITORIA INTERNA
        console.log(`[DEBUG CALENDAR] ID: ${b.id} | Tipo: ${b.type} | Hóspedes: ${b.guestCount} | Obs: ${b.observations}`);
        
        return {
          id: b.id,
          type: b.type,
          startDate: b.startDate.toISOString(),
          endDate: b.endDate.toISOString(),
          title: b.type === 'RESERVATION' ? 'Reserva' : 
                 b.type === 'MAINTENANCE' ? 'Manutenção' : 'Bloqueio',
          status: 'Confirmed',
          observations: String(b.observations || ''),
          guestCount: Number(b.guestCount || 0),
          guestsDetail: b.guestsDetail || [],
          propertyId: b.propertyId
        };
      });

      return {
        id: p.id,
        name: p.title,
        cleanStatus: 'Pronto',
        events: events,
      };
    });
  }
}
