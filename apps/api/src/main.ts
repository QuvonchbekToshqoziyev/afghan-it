import 'reflect-metadata';
import { config } from 'dotenv';
config({ path: '.env.local' });
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

const app = await NestFactory.create(AppModule);
app.enableCors({ origin: true, credentials: true });
app.setGlobalPrefix('api/v1');
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
await app.listen(Number(process.env.PORT || 4000), '0.0.0.0');
