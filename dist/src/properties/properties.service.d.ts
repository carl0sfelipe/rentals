import { PrismaService } from '../prisma/prisma.service';
import { UnsplashService } from '../unsplash/unsplash.service';
interface PropertyDto {
    title: string;
    description: string;
    location?: string;
    address?: string;
    price?: number;
    pricePerNight?: number;
    bedrooms?: number;
    bathrooms?: number;
    imageUrl?: string;
    amenities?: string[];
}
interface UpdatePropertyDto {
    title?: string;
    description?: string;
    address?: string;
    pricePerNight?: number;
    bedrooms?: number;
    bathrooms?: number;
    imageUrl?: string;
}
export declare class PropertiesService {
    private readonly prisma;
    private readonly unsplashService;
    constructor(prisma: PrismaService, unsplashService: UnsplashService);
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
        imageUrl: string | null;
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
        imageUrl: string | null;
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
        imageUrl: string | null;
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
        imageUrl: string | null;
    }>;
    remove(userId: string, id: string): Promise<{
        deleted: boolean;
    }>;
    getCalendar(userId: string, propertyId: string): Promise<string>;
    private formatICalDate;
    private formatICalDateTime;
}
export {};
