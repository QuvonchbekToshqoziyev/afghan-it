import { Body, Controller, Get, Injectable, Inject, NotFoundException, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { eq, and, count, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { certificates, createDb, courses, modules, lessons, enrollments, lessonProgress, xpEvents } from '@afghan-it/db';
import { Public } from '../auth/public.decorator.js';
import type { AuthenticatedRequest } from '../auth/access-token.guard.js';

@Injectable()
class LearningService {
  private readonly database = createDb();
  async listCourses() { return this.database.db.select().from(courses).where(eq(courses.published, true)); }
  async course(id: string) {
    const [course] = await this.database.db.select().from(courses).where(eq(courses.id, id));
    if (!course || !course.published) return null;
    const courseModules = await this.database.db.select().from(modules).where(eq(modules.courseId, id));
    const allLessons = courseModules.length
      ? await this.database.db.select().from(lessons).where(inArray(lessons.moduleId, courseModules.map((module) => module.id)))
      : [];
    return { ...course, modules: courseModules.map((module) => ({ ...module, lessons: allLessons.filter((lesson) => lesson.moduleId === module.id) })) };
  }
  async enroll(userId: string, courseId: string) {
    const [course] = await this.database.db.select({ id: courses.id }).from(courses).where(and(eq(courses.id, courseId), eq(courses.published, true)));
    if (!course) throw new NotFoundException('Published course not found');
    const [item] = await this.database.db.insert(enrollments).values({ userId, courseId }).onConflictDoNothing().returning();
    return item || (await this.database.db.select().from(enrollments).where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))))[0];
  }
  async progress(userId: string, lessonId: string, rawPercent: number) {
    const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));
    const [lesson] = await this.database.db.select({ id: lessons.id, courseId: modules.courseId })
      .from(lessons).innerJoin(modules, eq(lessons.moduleId, modules.id)).where(eq(lessons.id, lessonId));
    if (!lesson) throw new NotFoundException('Lesson not found');
    const [enrollment] = await this.database.db.select({ id: enrollments.id }).from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, lesson.courseId), eq(enrollments.status, 'active')));
    if (!enrollment) throw new UnauthorizedException('Enroll in the course before recording lesson progress');
    const [item] = await this.database.db.insert(lessonProgress).values({ userId, lessonId, percent, completed: percent >= 100, updatedAt: new Date() })
      .onConflictDoUpdate({ target: [lessonProgress.userId, lessonProgress.lessonId], set: { percent, completed: percent >= 100, updatedAt: new Date() } }).returning();
    if (item.completed) await this.completeCourseIfReady(userId, lesson.courseId);
    return item;
  }

  private async completeCourseIfReady(userId: string, courseId: string) {
    const courseModules = await this.database.db.select({ id: modules.id }).from(modules).where(eq(modules.courseId, courseId));
    if (!courseModules.length) return;
    const allLessons = await this.database.db.select({ id: lessons.id }).from(lessons).where(inArray(lessons.moduleId, courseModules.map(({ id }) => id)));
    if (!allLessons.length) return;
    const completed = await this.database.db.select({ total: count(lessonProgress.lessonId) }).from(lessonProgress)
      .where(and(eq(lessonProgress.userId, userId), eq(lessonProgress.completed, true), inArray(lessonProgress.lessonId, allLessons.map(({ id }) => id))));
    if (Number(completed[0]?.total || 0) !== allLessons.length) return;
    const existing = await this.database.db.select({ id: certificates.id }).from(certificates).where(and(eq(certificates.userId, userId), eq(certificates.courseId, courseId)));
    if (existing.length) return;
    await this.database.db.insert(certificates).values({ userId, courseId, verificationId: randomUUID() });
    await this.database.db.insert(xpEvents).values({ userId, amount: 100, reason: `course-complete:${courseId}` });
    await this.database.db.update(enrollments).set({ status: 'completed' }).where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));
  }
  async myCourses(userId: string) {
    return this.database.db.select({ enrollment: enrollments, course: courses }).from(enrollments)
      .innerJoin(courses, eq(enrollments.courseId, courses.id)).where(eq(enrollments.userId, userId));
  }
}

@Controller('courses')
class CoursesController {
  constructor(@Inject(LearningService) private readonly learning: LearningService) {}
  @Public()
  @Get() list() { return this.learning.listCourses(); }
  @Public()
  @Get(':id') course(@Param('id') id: string) { return this.learning.course(id); }
  @Post(':id/enroll') enroll(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.learning.enroll(req.user!.id, id); }
}

@Controller('enrollments')
class EnrollmentsController {
  constructor(@Inject(LearningService) private readonly learning: LearningService) {}
  @Get('me') myCourses(@Req() req: AuthenticatedRequest) { return this.learning.myCourses(req.user!.id); }
}

@Controller('lessons')
class LessonsController {
  constructor(@Inject(LearningService) private readonly learning: LearningService) {}
  @Post(':id/progress') progress(@Param('id') id: string, @Body() body: { percent: number }, @Req() req: AuthenticatedRequest) { return this.learning.progress(req.user!.id, id, Number(body.percent)); }
}

@Module({ controllers: [CoursesController, EnrollmentsController, LessonsController], providers: [LearningService] })
export class LearningModule {}
