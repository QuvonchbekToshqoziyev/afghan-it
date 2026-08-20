import { Controller, Get, Inject, Injectable, NotFoundException, Param, Req } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { and, count, desc, eq, sql } from 'drizzle-orm';
import { certificates, courses, createDb, enrollments, lessonProgress, plans, subscriptions, xpEvents } from '@afghan-it/db';
import type { AuthenticatedRequest } from '../auth/access-token.guard.js';
import { Public } from '../auth/public.decorator.js';

@Injectable()
class StudentService {
  private readonly database = createDb();

  async dashboard(userId: string) {
    const enrolled = await this.database.db.select({ course: courses, enrollment: enrollments })
      .from(enrollments).innerJoin(courses, eq(enrollments.courseId, courses.id)).where(eq(enrollments.userId, userId));
    const progress = await this.database.db.select({ completed: count(lessonProgress.lessonId) })
      .from(lessonProgress).where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.completed, true)));
    const points = await this.database.db.select({ total: sql<number>`coalesce(sum(${xpEvents.amount}), 0)` }).from(xpEvents).where(eq(xpEvents.userId, userId));
    const earnedCertificates = await this.database.db.select().from(certificates).where(eq(certificates.userId, userId));
    return { enrollments: enrolled, completedLessons: Number(progress[0]?.completed || 0), xp: Number(points[0]?.total || 0), certificates: earnedCertificates };
  }

  certificates(userId: string) {
    return this.database.db.select({ certificate: certificates, course: courses }).from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id)).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issuedAt));
  }

  async verifyCertificate(verificationId: string) {
    const [result] = await this.database.db.select({ certificate: certificates, course: courses }).from(certificates)
      .innerJoin(courses, eq(certificates.courseId, courses.id)).where(eq(certificates.verificationId, verificationId));
    if (!result) throw new NotFoundException('Certificate not found');
    return result;
  }

  plans() { return this.database.db.select().from(plans); }

  mySubscription(userId: string) {
    return this.database.db.select({ subscription: subscriptions, plan: plans }).from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id)).where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')));
  }

  leaderboard() {
    return this.database.db.select({ userId: xpEvents.userId, xp: sql<number>`sum(${xpEvents.amount})` }).from(xpEvents)
      .groupBy(xpEvents.userId).orderBy(desc(sql`sum(${xpEvents.amount})`)).limit(20);
  }
}

@Controller()
class StudentController {
  constructor(@Inject(StudentService) private readonly student: StudentService) {}
  @Get('dashboard') dashboard(@Req() request: AuthenticatedRequest) { return this.student.dashboard(request.user!.id); }
  @Get('certificates/me') certificates(@Req() request: AuthenticatedRequest) { return this.student.certificates(request.user!.id); }
  @Public()
  @Get('plans') plans() { return this.student.plans(); }
  @Get('subscriptions/me') subscription(@Req() request: AuthenticatedRequest) { return this.student.mySubscription(request.user!.id); }
  @Public()
  @Get('leaderboard') leaderboard() { return this.student.leaderboard(); }
}

@Controller('certificates')
class CertificateController {
  constructor(@Inject(StudentService) private readonly student: StudentService) {}
  @Public()
  @Get('verify/:verificationId') verify(@Param('verificationId') verificationId: string) { return this.student.verifyCertificate(verificationId); }
}

@Module({ controllers: [StudentController, CertificateController], providers: [StudentService] })
export class StudentModule {}
