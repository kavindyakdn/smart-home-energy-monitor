import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend communication
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:8080,http://127.0.0.1:8080')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const corsCredentials = String(process.env.CORS_CREDENTIALS ?? 'true').toLowerCase() !== 'false';

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: corsCredentials,
  });

  // Set global API prefix for versioning
  app.setGlobalPrefix('api/v1');

  await app.listen(3000);
}
bootstrap();
