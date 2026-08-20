import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import { createDb, roles } from '@afghan-it/db';
import { ROLE_KEY } from './roles.decorator.js';
import type { AuthenticatedRequest } from './access-token.guard.js';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly database = createDb();
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext) {
    const required = this.reflector.getAllAndOverride<string[]>(ROLE_KEY, [context.getHandler(), context.getClass()]);
    if (!required?.length) return true;
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const assigned = await this.database.db.select({ role: roles.role }).from(roles).where(eq(roles.userId, request.user!.id));
    if (!assigned.some(({ role }) => required.includes(role))) throw new ForbiddenException('This action requires a teacher or administrator account');
    return true;
  }
}
