import { Body, Controller, HttpCode, HttpStatus, Post, Inject, BadRequestException } from '@nestjs/common';
import { AuthService, RegisterDto, LoginDto } from './auth.service';
import { IsEmail, IsString, MinLength, validate } from 'class-validator';
import { Transform, Type, plainToClass } from 'class-transformer';

export class RegisterRequestDto implements RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;
}

export class LoginRequestDto implements LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('debug-prisma')
  async debugPrisma(@Body() body: any) {
    const { PrismaService } = await import('../prisma/prisma.service');
    const prisma = new PrismaService();
    await prisma.onModuleInit();
    
    console.log('DEBUG: Testing direct Prisma call');
    try {
      const user = await prisma.user.create({
        data: { 
          email: 'debug@test.com', 
          password: 'hashedpassword', 
          name: 'Debug User' 
        }
      });
      console.log('DEBUG: User created successfully:', user);
      return { success: true, user };
    } catch (error: any) {
      console.log('DEBUG: Error creating user:', error);
      return { success: false, error: error.message };
    }
  }

  @Post('register')
  async register(@Body() body: any) {
    const dto = plainToClass(RegisterRequestDto, body);
    
    // Validate the DTO
    const errors = await validate(dto);
    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }
    
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequestDto) {
    return this.authService.login(dto);
  }
}
