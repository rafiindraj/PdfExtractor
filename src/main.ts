import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// 1. Import json and urlencoded from express
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ /* ... */ });
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ extended: true, limit: '100mb' }));

  const server = await app.listen(3000);

  // ADD THIS: Tell the server not to drop the connection for 5 minutes
  server.setTimeout(300000);
}
bootstrap();