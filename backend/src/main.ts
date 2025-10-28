import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global API prefix for versioning
  app.setGlobalPrefix('api/v1');

  await app.listen(3000);
}
bootstrap();
