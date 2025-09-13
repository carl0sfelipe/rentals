import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrganizationContextService } from '../organizations/organization-context.service';
import { isTenantIsolationEnabled } from '../config/feature-flags';

interface PropertyDto { 
  title: string; 
  description: string; 
  location?: string; // Compatibilidade com frontend
  address?: string; 
  price?: number; // Aceita price do frontend
  pricePerNight?: number; 
  bedrooms?: number; 
  bathrooms?: number;
  amenities?: string[]; // Para compatibilidade 
}
interface UpdatePropertyDto { 
  title?: string; 
  description?: string; 
  address?: string; 
  pricePerNight?: number; 
  bedrooms?: number; 
  bathrooms?: number; 
}

@Injectable()
export class PropertiesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly organizationContext: OrganizationContextService
  ) {}

  async create(userId: string, data: PropertyDto) {
    const propertyData = {
      title: data.title,
      description: data.description,
      address: data.address || data.location || '', // Mapeia location para address
      pricePerNight: data.pricePerNight || data.price || 0, // Mapeia price para pricePerNight
      bedrooms: data.bedrooms || 1,
      bathrooms: data.bathrooms || 1,
      userId: userId
    };

    // Adicionar organizationId se multi-tenant estiver habilitado
    if (isTenantIsolationEnabled()) {
      const activeOrgId = this.organizationContext.getActiveOrganizationId();
      console.log('🏢 PropertiesService.create - Organization context:', {
        isTenantIsolationEnabled: isTenantIsolationEnabled(),
        activeOrgId,
        hasContext: this.organizationContext.hasContext(),
        fullContext: this.organizationContext.getContext()
      });
      
      if (activeOrgId) {
        (propertyData as any).organizationId = activeOrgId;
      }
    }
    
    return this.prisma.property.create({ 
      data: propertyData
    });
  }

  async findAll(userId: string) {
    const where: any = { userId };
    
    // Adicionar filtro de organizationId se multi-tenant estiver habilitado
    if (isTenantIsolationEnabled()) {
      const activeOrgId = this.organizationContext.getActiveOrganizationId();
      if (activeOrgId) {
        where.organizationId = activeOrgId;
      }
    }
    
    return this.prisma.property.findMany({ where });
  }

  async findOne(userId: string, id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.userId !== userId) throw new ForbiddenException();
    return property;
  }

  async update(userId: string, id: string, data: UpdatePropertyDto) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.userId !== userId) throw new ForbiddenException();
    return this.prisma.property.update({ where: { id }, data });
  }

  async remove(userId: string, id: string) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) throw new NotFoundException('Property not found');
    if (property.userId !== userId) throw new ForbiddenException();
    await this.prisma.property.delete({ where: { id } });
    return { deleted: true };
  }

  async getCalendar(userId: string, propertyId: string): Promise<string> {
    // Verificar se a propriedade existe e se o usuário tem acesso
    const property = await this.prisma.property.findUnique({ 
      where: { id: propertyId }
    });

    if (!property) {
      throw new Error('Property not found');
    }

    if (property.userId !== userId) {
      throw new Error('Access denied');
    }

    // Buscar bookings da propriedade
    const bookings = await (this.prisma as any).booking.findMany({
      where: { propertyId },
      orderBy: { startDate: 'asc' }
    });

    // Gerar conteúdo iCalendar
    const now = new Date();
    const calendarLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//SuaEmpresa//SeuApp//PT',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${property.title}`,
      `X-WR-CALDESC:Calendário de reservas para ${property.title}`,
    ];

    // Adicionar eventos para cada booking
    for (const booking of bookings) {
      const uid = `booking-${booking.id}@suaempresa.com`;
      const startDateStr = this.formatICalDate(booking.startDate);
      const endDateStr = this.formatICalDate(booking.endDate);
      const summary = booking.type === 'RESERVATION' ? 'RESERVA' : 'BLOQUEADO';
      const createdAtStr = this.formatICalDateTime(booking.createdAt);

      calendarLines.push(
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${this.formatICalDateTime(now)}`,
        `DTSTART;VALUE=DATE:${startDateStr}`,
        `DTEND;VALUE=DATE:${endDateStr}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${booking.type === 'RESERVATION' ? 'Período reservado' : 'Período bloqueado'} - ${property.title}`,
        `LOCATION:${property.address}`,
        `CREATED:${createdAtStr}`,
        `LAST-MODIFIED:${createdAtStr}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      );
    }

    calendarLines.push('END:VCALENDAR');
    
    return calendarLines.join('\r\n');
  }

  private formatICalDate(date: Date): string {
    // Formato: YYYYMMDD
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    return `${year}${month}${day}`;
  }

  private formatICalDateTime(date: Date): string {
    // Formato: YYYYMMDDTHHMMSSZ
    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }
}
