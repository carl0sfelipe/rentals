import { AuthService, RegisterDto, LoginDto } from './auth.service';
declare class RegisterRequestDto implements RegisterDto {
    email: string;
    password: string;
}
declare class LoginRequestDto implements LoginDto {
    email: string;
    password: string;
}
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    register(dto: RegisterRequestDto): Promise<any>;
    login(dto: LoginRequestDto): Promise<{
        access_token: any;
    }>;
}
export {};
