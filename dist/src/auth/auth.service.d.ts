import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class RegisterDto {
    email: string;
    password: string;
    name: string;
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
    private prisma;
    private jwt;
    private hasher;
    constructor(prisma: PrismaService, jwt: JwtService, hasher: PasswordHasher);
    register(dto: RegisterDto): Promise<{
        access_token: string;
    }>;
    login(dto: LoginDto): Promise<{
        access_token: string;
    }>;
}
