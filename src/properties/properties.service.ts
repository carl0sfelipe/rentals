import { ForbiddenException, Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UnsplashService } from '../unsplash/unsplash.service';

interface PropertyDto { 
  title: string; 
  description: string; 
  location?: string; // Compatibilidade com frontend
  address?: string; 
  price?: number; // Aceita price do frontend
  pricePerNight?: number; 
  bedrooms?: number; 
  bathrooms?: number;
  imageUrl?: string; // Nova propriedade para imagem
  amenities?: string[]; // Para compatibilidade 
}
interface UpdatePropertyDto { 
  title?: string; 
  description?: string; 
  address?: string; 
  pricePerNight?: number; 
  bedrooms?: number; 
  bathrooms?: number; 
  imageUrl?: string; // Nova propriedade para imagem
}

@Injectable()
export class PropertiesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    private readonly unsplashService: UnsplashService
  ) {}

  async create(userId: string, data: PropertyDto) {
    // Se não há imageUrl fornecida, usar uma imagem do Unsplash
    const imageUrl = data.imageUrl || this.unsplashService.getRandomCuratedArchitectureImage();
    
    const propertyData = {
      title: data.title,
      description: data.description,
      address: data.address || data.location || '', // Mapeia location para address
      pricePerNight: data.pricePerNight || data.price || 0, // Mapeia price para pricePerNight
      bedrooms: data.bedrooms || 1,
      bathrooms: data.bathrooms || 1,
      imageUrl: imageUrl, // Adicionar imageUrl
      userId: userId
    };
    
    return this.prisma.property.create({ 
      data: propertyData
    });
  }

  async findAll(userId: string) {
    return this.prisma.property.findMany({ where: { userId } });
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
    
    // Se não há imageUrl na atualização e a propriedade atual não tem imagem, gerar uma nova
    const updateData = { ...data };
    if (!updateData.imageUrl && !property.imageUrl) {
      updateData.imageUrl = this.unsplashService.getRandomCuratedArchitectureImage();
    }
    
    return this.prisma.property.update({ where: { id }, data: updateData });
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

  async publishAd(userId: string, propertyId: string, scarcityPreferences?: { showCountdown: boolean; showHighDemand: boolean; showViewCount: boolean }) {
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

    // Gerar slug único baseado no ID da propriedade (abordagem segura sem mudanças no schema)
    const slug = `ad-${propertyId}`;

    // Gerar URL pública (ajuste conforme seu domínio)
    const publicUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/public/${slug}`;

    // Preparar dados para atualização
    const updateData: any = { publicUrl };

    // Se foram fornecidas preferências de escassez, salvar elas
    if (scarcityPreferences) {
      updateData.showCountdown = scarcityPreferences.showCountdown;
      updateData.showHighDemand = scarcityPreferences.showHighDemand;
      updateData.showViewCount = scarcityPreferences.showViewCount;
    }

    // Salvar a URL pública e preferências no banco de dados
    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: updateData
    });

    return {
      publicUrl,
      slug,
      property: {
        id: updatedProperty.id,
        title: updatedProperty.title,
        description: updatedProperty.description,
        address: updatedProperty.address,
        pricePerNight: updatedProperty.pricePerNight,
        bedrooms: updatedProperty.bedrooms,
        bathrooms: updatedProperty.bathrooms,
        imageUrl: updatedProperty.imageUrl,
        publicUrl: updatedProperty.publicUrl,
        showCountdown: updatedProperty.showCountdown,
        showHighDemand: updatedProperty.showHighDemand,
        showViewCount: updatedProperty.showViewCount
      }
    };
  }

  async getPublicAd(slug: string) {
    // Extrair o ID da propriedade do slug
    const propertyId = slug.replace('ad-', '');

    const property = await this.prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      throw new Error('Ad not found');
    }

    return {
      id: property.id,
      title: property.title,
      description: property.description,
      address: property.address,
      pricePerNight: property.pricePerNight,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      imageUrl: property.imageUrl,
      showCountdown: property.showCountdown,
      showHighDemand: property.showHighDemand,
      showViewCount: property.showViewCount,
      publishedAt: property.createdAt // Usar createdAt como publishedAt
    };
  }

  async unpublishAd(userId: string, propertyId: string) {
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

    // Remover a URL pública (despublicar)
    const updatedProperty = await this.prisma.property.update({
      where: { id: propertyId },
      data: { publicUrl: null }
    });

    return {
      property: {
        id: updatedProperty.id,
        title: updatedProperty.title,
        description: updatedProperty.description,
        address: updatedProperty.address,
        pricePerNight: updatedProperty.pricePerNight,
        bedrooms: updatedProperty.bedrooms,
        bathrooms: updatedProperty.bathrooms,
        imageUrl: updatedProperty.imageUrl,
        publicUrl: updatedProperty.publicUrl
      }
    };
  }


}
