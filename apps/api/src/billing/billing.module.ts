import { Controller, Inject, Injectable, Post, Req, ServiceUnavailableException } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createDb, plans, subscriptions, users } from '@afghan-it/db';
import { Public } from '../auth/public.decorator.js';
import type { AuthenticatedRequest } from '../auth/access-token.guard.js';

type RawRequest = AuthenticatedRequest & { headers: AuthenticatedRequest['headers'] & { 'stripe-signature'?: string }; rawBody?: Buffer };

@Injectable()
class BillingService {
  private readonly database = createDb();

  async checkout(userId: string) {
    const secret = process.env.STRIPE_SECRET_KEY;
    const price = process.env.STRIPE_PRICE_ID;
    if (!secret || !price) throw new ServiceUnavailableException('Professional checkout is not configured');
    const [user] = await this.database.db.select({ email: users.email }).from(users).where(eq(users.id, userId));
    if (!user) throw new ServiceUnavailableException('User not found');
    const origin = process.env.WEB_APP_ORIGIN || 'http://localhost:3000';
    const body = new URLSearchParams({ mode: 'subscription', 'line_items[0][price]': price, 'line_items[0][quantity]': '1', customer_email: user.email, 'metadata[user_id]': userId, success_url: `${origin}/?billing=success`, cancel_url: `${origin}/?billing=cancelled` });
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', { method: 'POST', headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/x-www-form-urlencoded' }, body });
    const result = await response.json() as { url?: string };
    if (!response.ok || !result.url) throw new ServiceUnavailableException('Stripe checkout could not be created');
    return { url: result.url };
  }

  async webhook(signature: string | undefined, rawBody: Buffer | undefined) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !signature || !rawBody) throw new ServiceUnavailableException('Stripe webhook is not configured');
    const parts = Object.fromEntries(signature.split(',').map((part) => part.split('=')));
    const expected = createHmac('sha256', secret).update(`${parts.t}.${rawBody.toString()}`).digest('hex');
    if (!parts.t || Math.abs(Date.now() / 1000 - Number(parts.t)) > 300 || !parts.v1 || parts.v1.length !== expected.length || !timingSafeEqual(Buffer.from(parts.v1), Buffer.from(expected))) throw new ServiceUnavailableException('Invalid Stripe signature');
    const event = JSON.parse(rawBody.toString()) as { type?: string; data?: { object?: { metadata?: { user_id?: string }; status?: string } } };
    if (event.type === 'checkout.session.completed' && event.data?.object?.metadata?.user_id) {
      const userId = event.data.object.metadata.user_id;
      const [plan] = await this.database.db.select({ id: plans.id }).from(plans).where(eq(plans.slug, 'professional'));
      if (plan) await this.database.db.insert(subscriptions).values({ userId, planId: plan.id, status: 'active' }).onConflictDoNothing();
    }
    return { received: true };
  }
}

@Controller('subscriptions')
class BillingController {
  constructor(@Inject(BillingService) private readonly billing: BillingService) {}
  @Post('checkout') checkout(@Req() request: AuthenticatedRequest) { return this.billing.checkout(request.user!.id); }
}

@Controller('billing')
class WebhookController {
  constructor(@Inject(BillingService) private readonly billing: BillingService) {}
  @Public()
  @Post('webhook') webhook(@Req() request: RawRequest) { return this.billing.webhook(request.headers['stripe-signature'] as string | undefined, request.rawBody); }
}

@Module({ controllers: [BillingController, WebhookController], providers: [BillingService] })
export class BillingModule {}
