import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS configuration - enable CORS first
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Serve static files from uploads directory
  // __dirname in compiled code points to dist/src, so we need to go up two levels
  app.useStaticAssets(join(__dirname, '..', '..', 'uploads'), {
    prefix: '/uploads/',
  });

  // Global validation pipe with security settings
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties exist
      forbidUnknownValues: true,
      transform: true, // Auto-transform payloads to DTO instances
      stopAtFirstError: false,
    }),
  );

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
}
void bootstrap();
