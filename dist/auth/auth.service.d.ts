interface RegisterDto {
    email: string;
    password: string;
}
interface LoginDto {
    email: string;
    password: string;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    constructor(prisma: any, jwt: any);
    protected hashPassword(plain: string): Promise<string>;
    protected comparePassword(plain: string, hashed: string): Promise<boolean>;
    register(dto: RegisterDto): Promise<any>;
    login(dto: LoginDto): Promise<{
        access_token: any;
    }>;
}
export {};
