import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

export async function createApiApplication() {
  for (const name of ['DATABASE_URL', 'JWT_SECRET']) {
    if (!process.env[name]) throw new Error(`${name} is required to start the Afghan IT API`);
  }

  const app = await NestFactory.create(AppModule, { rawBody: true });
  const allowedOrigins = (process.env.WEB_APP_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({ origin: allowedOrigins, credentials: true });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  return app;
}
