import { Body, Controller, HttpException, Injectable, Post, Req, ServiceUnavailableException } from '@nestjs/common';
import { Module } from '@nestjs/common';
import type { AuthenticatedRequest } from '../auth/access-token.guard.js';

@Injectable()
class MentorService {
  async answer(message: string) {
    const key = process.env.OPENAI_API_KEY;
    if (!key) throw new ServiceUnavailableException('AI Mentor is not configured');
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-4o-mini', instructions: 'You are Afghan IT Academy AI Mentor. Give concise, practical help for IT, English learning, debugging and homework. Never invent facts. Reply in the learner language when evident.', input: message }),
    });
    if (!response.ok) throw new HttpException('AI Mentor could not answer right now', response.status);
    const data = await response.json() as { output_text?: string };
    return { answer: data.output_text || 'I could not produce an answer.' };
  }
}

@Controller('ai')
class MentorController {
  constructor(private readonly mentor: MentorService) {}
  @Post('mentor') answer(@Body() body: { message?: string }, @Req() _request: AuthenticatedRequest) {
    const message = body.message?.trim();
    if (!message) throw new HttpException('Message is required', 400);
    return this.mentor.answer(message);
  }
}

@Module({ controllers: [MentorController], providers: [MentorService] })
export class AiModule {}
