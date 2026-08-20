import { BadRequestException, Body, Controller, ForbiddenException, Get, Injectable, Inject, NotFoundException, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { eq, and, count, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { achievements, assessmentAttempts, assessmentQuestions, certificates, createDb, courses, modules, lessons, enrollments, lessonProgress, plans, subscriptions, userAchievements, xpEvents } from '@afghan-it/db';
import { Public } from '../auth/public.decorator.js';
import type { AuthenticatedRequest } from '../auth/access-token.guard.js';

@Injectable()
class LearningService {
  private readonly database = createDb();
  async listCourses() { return this.database.db.select().from(courses).where(eq(courses.published, true)); }
  async course(id: string) {
    const [course] = await this.database.db.select().from(courses).where(eq(courses.id, id));
    if (!course || !course.published) throw new NotFoundException('Published course not found');
    const courseModules = await this.database.db.select().from(modules).where(eq(modules.courseId, id));
    const allLessons = courseModules.length
      ? await this.database.db.select().from(lessons).where(inArray(lessons.moduleId, courseModules.map((module) => module.id)))
      : [];
    return { ...course, modules: courseModules.map((module) => ({ ...module, lessons: allLessons.filter((lesson) => lesson.moduleId === module.id) })) };
  }
  async enroll(userId: string, courseId: string) {
    const [course] = await this.database.db.select({ id: courses.id, accessTier: courses.accessTier }).from(courses).where(and(eq(courses.id, courseId), eq(courses.published, true)));
    if (!course) throw new NotFoundException('Published course not found');
    if (course.accessTier === 'professional') {
      const [subscription] = await this.database.db.select({ id: subscriptions.id }).from(subscriptions).innerJoin(plans, eq(subscriptions.planId, plans.id)).where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active'), eq(plans.slug, 'professional')));
      if (!subscription) throw new ForbiddenException('This course requires the Professional plan');
    }
    const [item] = await this.database.db.insert(enrollments).values({ userId, courseId }).onConflictDoNothing().returning();
    await this.award(userId, 'streak-starter');
    return item || (await this.database.db.select().from(enrollments).where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))))[0];
  }
  private async award(userId: string, slug: string) {
    const [achievement] = await this.database.db.select({ id: achievements.id }).from(achievements).where(eq(achievements.slug, slug));
    if (achievement) await this.database.db.insert(userAchievements).values({ userId, achievementId: achievement.id }).onConflictDoNothing();
  }
  async progress(userId: string, lessonId: string, rawPercent: number) {
    const percent = Math.max(0, Math.min(100, Math.round(rawPercent)));
    const [lesson] = await this.database.db.select({ id: lessons.id, type: lessons.type, courseId: modules.courseId })
      .from(lessons).innerJoin(modules, eq(lessons.moduleId, modules.id)).where(eq(lessons.id, lessonId));
    if (!lesson) throw new NotFoundException('Lesson not found');
    const [enrollment] = await this.database.db.select({ id: enrollments.id }).from(enrollments)
      .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, lesson.courseId), eq(enrollments.status, 'active')));
    if (!enrollment) throw new UnauthorizedException('Enroll in the course before recording lesson progress');
    if (percent >= 100 && ['quiz', 'practical', 'exam'].includes(lesson.type)) throw new BadRequestException('Submit the assessment to complete this lesson');
    return this.recordProgress(userId, lessonId, lesson.courseId, percent);
  }

  private async recordProgress(userId: string, lessonId: string, courseId: string, percent: number) {
    const [item] = await this.database.db.insert(lessonProgress).values({ userId, lessonId, percent, completed: percent >= 100, updatedAt: new Date() })
      .onConflictDoUpdate({ target: [lessonProgress.userId, lessonProgress.lessonId], set: { percent, completed: percent >= 100, updatedAt: new Date() } }).returning();
    if (item.completed) await this.completeCourseIfReady(userId, courseId);
    return item;
  }

  async assessment(userId: string, lessonId: string) {
    const [lesson] = await this.database.db.select({ id: lessons.id, type: lessons.type, courseId: modules.courseId }).from(lessons).innerJoin(modules, eq(lessons.moduleId, modules.id)).where(eq(lessons.id, lessonId));
    if (!lesson || !['quiz', 'practical', 'exam'].includes(lesson.type)) throw new NotFoundException('Assessment not found');
    const [enrollment] = await this.database.db.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, lesson.courseId), eq(enrollments.status, 'active')));
    if (!enrollment) throw new UnauthorizedException('Enroll in the course before opening an assessment');
    return this.database.db.select({ id: assessmentQuestions.id, prompt: assessmentQuestions.prompt, kind: assessmentQuestions.kind, options: assessmentQuestions.options, points: assessmentQuestions.points, position: assessmentQuestions.position }).from(assessmentQuestions).where(eq(assessmentQuestions.lessonId, lessonId)).orderBy(assessmentQuestions.position);
  }

  async attempt(userId: string, lessonId: string, rawAnswers: Record<string, unknown>) {
    const [lesson] = await this.database.db.select({ id: lessons.id, type: lessons.type, courseId: modules.courseId }).from(lessons).innerJoin(modules, eq(lessons.moduleId, modules.id)).where(eq(lessons.id, lessonId));
    if (!lesson || !['quiz', 'practical', 'exam'].includes(lesson.type)) throw new NotFoundException('Assessment not found');
    const [enrollment] = await this.database.db.select({ id: enrollments.id }).from(enrollments).where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, lesson.courseId), eq(enrollments.status, 'active')));
    if (!enrollment) throw new UnauthorizedException('Enroll in the course before submitting an assessment');
    const questions = await this.database.db.select().from(assessmentQuestions).where(eq(assessmentQuestions.lessonId, lessonId));
    const answers = Object.fromEntries(Object.entries(rawAnswers || {}).map(([key, value]) => [key, String(value).slice(0, 10000)]));
    const total = questions.reduce((sum, question) => sum + question.points, 0) || 1;
    const score = questions.reduce((sum, question) => sum + (question.answer && answers[question.id]?.trim().toLowerCase() === question.answer.trim().toLowerCase() ? question.points : 0), 0);
    const practicalSubmission = lesson.type === 'practical' && Object.values(answers).some((value) => value.trim().length >= 20);
    const passed = practicalSubmission || score / total >= 0.7;
    const [attempt] = await this.database.db.insert(assessmentAttempts).values({ userId, lessonId, answers, score: Math.round((score / total) * 100), passed }).returning();
    if (passed) {
      await this.recordProgress(userId, lessonId, lesson.courseId, 100);
      await this.database.db.insert(xpEvents).values({ userId, amount: 10, reason: `assessment-pass:${lessonId}` });
      if (lesson.type === 'exam') {
        const passedTypes = await this.database.db.select({ type: lessons.type }).from(assessmentAttempts).innerJoin(lessons, eq(assessmentAttempts.lessonId, lessons.id)).where(and(eq(assessmentAttempts.userId, userId), eq(assessmentAttempts.passed, true)));
        const types = new Set(passedTypes.map(({ type }) => type));
        if (types.has('quiz') && types.has('practical') && types.has('exam')) await this.award(userId, 'assessment-master');
      }
    }
    return { ...attempt, passed, score: Math.round((score / total) * 100) };
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
    await this.award(userId, 'first-course');
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
  @Get(':id/assessment') assessment(@Param('id') id: string, @Req() req: AuthenticatedRequest) { return this.learning.assessment(req.user!.id, id); }
  @Post(':id/attempt') attempt(@Param('id') id: string, @Body() body: { answers?: Record<string, unknown> }, @Req() req: AuthenticatedRequest) { return this.learning.attempt(req.user!.id, id, body.answers || {}); }
  @Post(':id/progress') progress(@Param('id') id: string, @Body() body: { percent: number }, @Req() req: AuthenticatedRequest) { return this.learning.progress(req.user!.id, id, Number(body.percent)); }
}

@Module({ controllers: [CoursesController, EnrollmentsController, LessonsController], providers: [LearningService] })
export class LearningModule {}
