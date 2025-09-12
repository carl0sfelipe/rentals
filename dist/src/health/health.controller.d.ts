export declare class HealthController {
    private readonly prisma;
    constructor(prisma: any);
    check(): Promise<{
        status: string;
        db: string;
    }>;
}
