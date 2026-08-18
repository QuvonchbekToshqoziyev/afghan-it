import { Body, Controller, Get, Injectable, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { createDb, courses, modules, lessons, enrollments, lessonProgress } from '@afghan-it/db';

@Injectable()
class LearningService {
  private readonly database = createDb();
  async listCourses() { return this.database.db.select().from(courses).where(eq(courses.published, true)); }
  async course(id: string) { const [course] = await this.database.db.select().from(courses).where(eq(courses.id, id)); if (!course) return null; const courseModules = await this.database.db.select().from(modules).where(eq(modules.courseId, id)); const allLessons = courseModules.length ? await this.database.db.select().from(lessons).where(eq(lessons.moduleId, courseModules[0].id)) : []; return { ...course, modules: courseModules.map((m) => ({ ...m, lessons: allLessons.filter((lesson) => lesson.moduleId === m.id) })) }; }
  async enroll(userId: string, courseId: string) { const [item] = await this.database.db.insert(enrollments).values({ userId, courseId }).onConflictDoNothing().returning(); return item || (await this.database.db.select().from(enrollments).where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId))))[0]; }
  async progress(userId: string, lessonId: string, percent: number) { const [item] = await this.database.db.insert(lessonProgress).values({ userId, lessonId, percent: Math.max(0, Math.min(100, percent)), completed: percent >= 100, updatedAt: new Date() }).onConflictDoUpdate({ target: [lessonProgress.userId, lessonProgress.lessonId], set: { percent: Math.max(0, Math.min(100, percent)), completed: percent >= 100, updatedAt: new Date() } }).returning(); return item; }
}

@Controller('courses')
class CoursesController {
  constructor(private readonly learning: LearningService) {}
  @Get() list() { return this.learning.listCourses(); }
  @Get(':id') course(@Param('id') id: string) { return this.learning.course(id); }
  @Post(':id/enroll') enroll(@Param('id') id: string, @Req() req: { user?: { id: string } }) { if (!req.user?.id) throw new UnauthorizedException(); return this.learning.enroll(req.user.id, id); }
}

@Controller('lessons')
class LessonsController {
  constructor(private readonly learning: LearningService) {}
  @Post(':id/progress') progress(@Param('id') id: string, @Body() body: { percent: number }, @Req() req: { user?: { id: string } }) { if (!req.user?.id) throw new UnauthorizedException(); return this.learning.progress(req.user.id, id, Number(body.percent)); }
}

@Module({ controllers: [CoursesController, LessonsController], providers: [LearningService] })
export class LearningModule {}
