interface PropertyDto {
    title: string;
    description?: string;
}
interface UpdatePropertyDto {
    title?: string;
    description?: string;
}
export declare class PropertiesService {
    private readonly prisma;
    constructor(prisma: any);
    create(userId: string, data: PropertyDto): Promise<any>;
    findOne(userId: string, id: string): Promise<any>;
    update(userId: string, id: string, data: UpdatePropertyDto): Promise<any>;
    remove(userId: string, id: string): Promise<{
        deleted: boolean;
    }>;
}
export {};
