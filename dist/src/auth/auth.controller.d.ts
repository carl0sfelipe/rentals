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
    register(body: any): Promise<{
        access_token: string;
    }>;
    login(dto: LoginRequestDto): Promise<{
        access_token: string;
    }>;
}
