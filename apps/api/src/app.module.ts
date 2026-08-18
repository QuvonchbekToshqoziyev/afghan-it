import { Module, Injectable, Controller, Get } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { LearningModule } from './learning/learning.module.js';

@Controller('health')
class HealthController { @Get() health() { return { ok: true, service: 'afghan-it-api', timestamp: new Date().toISOString() }; } }

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, LearningModule], controllers: [HealthController] })
export class AppModule {}
