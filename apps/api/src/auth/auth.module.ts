import { Body, Controller, Get, Injectable, Post, Req, Res, UnauthorizedException, ConflictException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { randomBytes, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { createDb, users, refreshTokens, roles, tenantMemberships, tenants } from '@afghan-it/db';
import { Public } from './public.decorator.js';
import type { AuthenticatedRequest } from './access-token.guard.js';

type AuthRequest = { user?: { id: string; email: string } };
type CookieResponse = { cookie(name: string, value: string, options: Record<string, unknown>): void; clearCookie(name: string, options: Record<string, unknown>): void };
type CookieRequest = AuthenticatedRequest & { headers: { cookie?: string } };

const refreshCookie = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/api/v1/auth', maxAge: 30 * 86400000 };
function readCookie(header: string | undefined, name: string) {
  return header?.split(';').map((item) => item.trim()).find((item) => item.startsWith(`${name}=`))?.slice(name.length + 1);
}

@Injectable()
export class AuthService {
  private readonly database = createDb();
  constructor(@Inject(JwtService) private readonly jwt: JwtService) {}
  private hash(value: string) { return createHash('sha256').update(value).digest('hex'); }
  async register(input: { email: string; password: string; name: string; preferredLocale?: string }) {
    const email = input.email.trim().toLowerCase();
    const existing = await this.database.db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing.length) throw new ConflictException('Email already registered');
    const [user] = await this.database.db.insert(users).values({ email, name: input.name.trim(), passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }), preferredLocale: input.preferredLocale || 'en' }).returning({ id: users.id, email: users.email, name: users.name });
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
  async me(userId: string) {
    const [user] = await this.database.db.select({ id: users.id, email: users.email, name: users.name, preferredLocale: users.preferredLocale }).from(users).where(eq(users.id, userId));
    if (!user) throw new UnauthorizedException('User not found');
    const assignedRoles = await this.database.db.select({ role: roles.role }).from(roles).where(eq(roles.userId, userId));
    const memberships = await this.database.db
      .select({ tenantId: tenants.id, tenantSlug: tenants.slug, tenantName: tenants.name, role: tenantMemberships.role })
      .from(tenantMemberships)
      .innerJoin(tenants, eq(tenantMemberships.tenantId, tenants.id))
      .where(eq(tenantMemberships.userId, userId));
    return { ...user, roles: assignedRoles.map(({ role }) => role), memberships };
  }
}

@Controller('auth')
class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}
  @Public()
  @Post('register') async register(@Body() body: { email: string; password: string; name: string; preferredLocale?: string }, @Res({ passthrough: true }) response: CookieResponse) { const session = await this.auth.register(body); response.cookie('afghan_it_refresh', session.refreshToken, refreshCookie); return { user: session.user, accessToken: session.accessToken }; }
  @Public()
  @Post('login') async login(@Body() body: { email: string; password: string }, @Res({ passthrough: true }) response: CookieResponse) { const session = await this.auth.login(body); response.cookie('afghan_it_refresh', session.refreshToken, refreshCookie); return { user: session.user, accessToken: session.accessToken }; }
  @Public()
  @Post('refresh') async refresh(@Req() request: CookieRequest, @Body() body: { refreshToken?: string }, @Res({ passthrough: true }) response: CookieResponse) { const refreshToken = body.refreshToken || readCookie(request.headers.cookie, 'afghan_it_refresh'); if (!refreshToken) throw new UnauthorizedException('Refresh token required'); const session = await this.auth.refresh(refreshToken); response.cookie('afghan_it_refresh', session.refreshToken, refreshCookie); return { user: session.user, accessToken: session.accessToken }; }
  @Public()
  @Post('logout') logout(@Res({ passthrough: true }) response: CookieResponse) { response.clearCookie('afghan_it_refresh', refreshCookie); return { ok: true }; }
  @Get('me') me(@Req() request: AuthenticatedRequest) { return this.auth.me(request.user!.id); }
  @Public()
  @Get('health') health() { return { ok: true }; }
}

@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET! })], controllers: [AuthController], providers: [AuthService], exports: [AuthService, JwtModule] })
export class AuthModule {}
