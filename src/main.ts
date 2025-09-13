import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilita CORS para permitir requisições do frontend
  const allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://rentals-frontend.vercel.app', // Adicionar domínio do frontend
    process.env.FRONTEND_URL, // Variável de ambiente para frontend
    process.env.CORS_ORIGINS?.split(',') || []
  ].flat().filter(Boolean) as string[];
  
  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
  
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true, 
    forbidNonWhitelisted: true, 
    transform: true 
  }));
  
  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  
  // eslint-disable-next-line no-console
  console.log(`🚀 API running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
