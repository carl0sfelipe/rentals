import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService, RegisterDto, LoginDto } from './auth.service';
import { IsEmail, IsString, MinLength } from 'class-validator';

class RegisterRequestDto implements RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

class LoginRequestDto implements LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterRequestDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequestDto) {
    return this.auth.login(dto);
  }
}
