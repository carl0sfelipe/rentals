import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilita CORS para permitir requisições do frontend
  const allowedOrigins = [
    'http://localhost:5173', 
    'http://localhost:3000',
    'https://rentals-amber.vercel.app', // URL de produção do Vercel
    'https://rentals-mtzfcuplh-carl0sfelipes-projects.vercel.app', // Preview URL atual
    process.env.FRONTEND_URL, // Variável de ambiente para frontend
    ...(process.env.CORS_ORIGINS?.split(',') || [])
  ].filter(Boolean) as string[];
  
  app.enableCors({
    origin: (origin, callback) => {
      // Permite requests sem origin (ex: mobile apps, Postman)
      if (!origin) return callback(null, true);
      
      // Permite qualquer subdomínio do Vercel
      if (origin.includes('.vercel.app')) {
        return callback(null, true);
      }
      
      // Permite origins específicos
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
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
