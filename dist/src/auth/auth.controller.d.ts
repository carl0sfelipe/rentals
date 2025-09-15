import { AuthService, RegisterDto, LoginDto } from './auth.service';
export declare class RegisterRequestDto implements RegisterDto {
    email: string;
    password: string;
    name: string;
}
export declare class LoginRequestDto implements LoginDto {
    email: string;
    password: string;
}
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    debugPrisma(body: any): Promise<{
        success: boolean;
        user: {
            name: string;
            id: string;
            email: string;
            password: string;
            activeOrganizationId: string | null;
            createdAt: Date;
            updatedAt: Date;
        };
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        user?: undefined;
    }>;
    register(body: any): Promise<{
        access_token: string;
        id: string;
        email: string;
        name: string;
    }>;
    login(dto: LoginRequestDto): Promise<{
        access_token: string;
    }>;
}
