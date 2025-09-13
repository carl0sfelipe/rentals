import { PrismaService } from '../prisma/prisma.service';
import { OrganizationContextService } from '../organizations/organization-context.service';
interface PropertyDto {
    title: string;
    description: string;
    location?: string;
    address?: string;
    price?: number;
    pricePerNight?: number;
    bedrooms?: number;
    bathrooms?: number;
    amenities?: string[];
}
interface UpdatePropertyDto {
    title?: string;
    description?: string;
    address?: string;
    pricePerNight?: number;
    bedrooms?: number;
    bathrooms?: number;
}
export declare class PropertiesService {
    private readonly prisma;
    private readonly organizationContext;
    constructor(prisma: PrismaService, organizationContext: OrganizationContextService);
    create(userId: string, data: PropertyDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        organizationId: string | null;
        title: string;
        description: string;
        address: string;
        pricePerNight: number;
        bedrooms: number;
        bathrooms: number;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        organizationId: string | null;
        title: string;
        description: string;
        address: string;
        pricePerNight: number;
        bedrooms: number;
        bathrooms: number;
    }[]>;
    findOne(userId: string, id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        organizationId: string | null;
        title: string;
        description: string;
        address: string;
        pricePerNight: number;
        bedrooms: number;
        bathrooms: number;
    }>;
    update(userId: string, id: string, data: UpdatePropertyDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        organizationId: string | null;
        title: string;
        description: string;
        address: string;
        pricePerNight: number;
        bedrooms: number;
        bathrooms: number;
    }>;
    remove(userId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    getCalendar(userId: string, propertyId: string): Promise<string>;
    private formatICalDate;
    private formatICalDateTime;
}
export {};
