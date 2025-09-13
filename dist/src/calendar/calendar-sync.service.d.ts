interface SyncParams {
    propertyId: string;
    url: string;
    horizonDays?: number;
}
interface AvailabilityUpsertArgs {
    where: {
        externalId: string;
    };
    create: {
        externalId: string;
        propertyId: string;
        start: Date;
        end: Date;
        summary?: string;
        source: string;
    };
    update: {
        start: Date;
        end: Date;
        summary?: string;
        source: string;
    };
}
interface PrismaLike {
    availability: {
        upsert(args: AvailabilityUpsertArgs): Promise<any>;
    };
    property?: {
        findMany(args: any): Promise<Array<{
            id: string;
            calendarUrl?: string;
        }>>;
    };
}
export declare class CalendarSyncService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaLike);
    syncForProperty(params: SyncParams): Promise<{
        processed: number;
    }>;
    scheduledSync(): Promise<void>;
}
export {};
