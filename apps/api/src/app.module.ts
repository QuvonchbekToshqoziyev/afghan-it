import { Module, Injectable, Controller, Get } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { LearningModule } from './learning/learning.module.js';
import { StudentModule } from './student/student.module.js';
import { AiModule } from './ai/ai.module.js';
import { ManagementModule } from './management/management.module.js';
import { BillingModule } from './billing/billing.module.js';
import { AccessTokenGuard } from './auth/access-token.guard.js';
import { Public } from './auth/public.decorator.js';

@Controller('health')
class HealthController {
  @Public()
  @Get()
  health() { return { ok: true, service: 'afghan-it-api', timestamp: new Date().toISOString() }; }
}

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, LearningModule, StudentModule, AiModule, ManagementModule, BillingModule],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: AccessTokenGuard }],
})
export class AppModule {}
