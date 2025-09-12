export declare class RegisterDto {
    email: string;
    password: string;
}
export declare class LoginDto {
    email: string;
    password: string;
}
export interface PasswordHasher {
    hash(plain: string): Promise<string>;
    compare(plain: string, hashed: string): Promise<boolean>;
}
export declare class PBKDF2Hasher implements PasswordHasher {
    hash(plain: string): Promise<string>;
    compare(plain: string, stored: string): Promise<boolean>;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly hasher;
    constructor(prisma: any, jwt: any, hasher: PasswordHasher);
    register(dto: RegisterDto): Promise<any>;
    login(dto: LoginDto): Promise<{
        access_token: any;
    }>;
}
