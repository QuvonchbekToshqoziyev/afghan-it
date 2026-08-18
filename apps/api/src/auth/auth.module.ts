import { Body, Controller, Get, Injectable, Post, Req, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { randomBytes, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { createDb, users, refreshTokens, roles } from '@afghan-it/db';

type AuthRequest = { user?: { id: string; email: string } };

@Injectable()
export class AuthService {
  private readonly database = createDb();
  constructor(private readonly jwt: JwtService) {}
  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
  async register(input: { email: string; password: string; name: string; preferredLocale?: string }) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.database.db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing.length) throw new UnauthorizedException('Email already registered');
    const [user] = await this.database.db.insert(users).values({ email, name: input.name.trim(), passwordHash: await argon2.hash(input.password), preferredLocale: input.preferredLocale || 'uz' }).returning({ id: users.id, email: users.email, name: users.name });
    await this.database.db.insert(roles).values({ userId: user.id, role: 'student' });
    return this.issue(user);
  }
  async login(input: { email: string; password: string }) {
    const [user] = await this.database.db.select().from(users).where(eq(users.email, input.email.trim().toLowerCase()));
    if (!user || !(await argon2.verify(user.passwordHash, input.password))) throw new UnauthorizedException('Invalid email or password');
    return this.issue({ id: user.id, email: user.email, name: user.name });
  }
  private async issue(user: { id: string; email: string; name: string }) {
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email }, { expiresIn: (process.env.ACCESS_TOKEN_TTL || '15m') as any });
    const refreshToken = randomBytes(48).toString('base64url');
    await this.database.db.insert(refreshTokens).values({ userId: user.id, tokenHash: this.hash(refreshToken), expiresAt: new Date(Date.now() + 30 * 86400000) });
    return { user, accessToken, refreshToken };
  }
  async refresh(raw: string) {
    const tokenHash = this.hash(raw);
    const [stored] = await this.database.db.select().from(refreshTokens).where(eq(refreshTokens.tokenHash, tokenHash));
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) throw new UnauthorizedException('Refresh token expired');
    await this.database.db.update(refreshTokens).set({ revokedAt: new Date() }).where(eq(refreshTokens.id, stored.id));
    const [user] = await this.database.db.select({ id: users.id, email: users.email, name: users.name }).from(users).where(eq(users.id, stored.userId));
    if (!user) throw new UnauthorizedException('User not found');
    return this.issue(user);
  }
}

@Controller('auth')
class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') register(@Body() body: { email: string; password: string; name: string; preferredLocale?: string }) { return this.auth.register(body); }
  @Post('login') login(@Body() body: { email: string; password: string }) { return this.auth.login(body); }
  @Post('refresh') refresh(@Body() body: { refreshToken: string }) { return this.auth.refresh(body.refreshToken); }
  @Get('health') health() { return { ok: true }; }
}

@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET || 'local-dev-only-change-me' })], controllers: [AuthController], providers: [AuthService], exports: [AuthService, JwtModule] })
export class AuthModule {}
