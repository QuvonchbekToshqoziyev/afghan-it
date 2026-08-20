import { Body, Controller, Get, Injectable, Param, Post, UseGuards } from '@nestjs/common';
import { Module } from '@nestjs/common';
import { count, desc, eq } from 'drizzle-orm';
import { certificates, courses, createDb, enrollments, lessons, modules, plans, roles, subscriptions, users } from '@afghan-it/db';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';

@Injectable()
class ManagementService {
  private readonly database = createDb();

  createCourse(input: { slug: string; title: string; description?: string; category: string; language?: string; level?: string; published?: boolean }) {
    return this.database.db.insert(courses).values({ ...input, description: input.description || '', language: input.language || 'en', level: input.level || 'beginner', published: input.published ?? false }).returning();
  }
  createModule(courseId: string, input: { title: string; position?: number }) {
    return this.database.db.insert(modules).values({ courseId, title: input.title, position: input.position || 0 }).returning();
  }
  createLesson(moduleId: string, input: { title: string; type?: 'video' | 'text' | 'quiz' | 'practical' | 'exam'; content?: string; mediaUrl?: string; position?: number; durationMinutes?: number }) {
    return this.database.db.insert(lessons).values({ moduleId, title: input.title, type: input.type || 'text', content: input.content || '', mediaUrl: input.mediaUrl || null, position: input.position || 0, durationMinutes: input.durationMinutes || 10 }).returning();
  }
  async teacherSummary() {
    const [courseCount] = await this.database.db.select({ total: count(courses.id) }).from(courses);
    const [learnerCount] = await this.database.db.select({ total: count(users.id) }).from(users);
    const [enrollmentCount] = await this.database.db.select({ total: count(enrollments.id) }).from(enrollments);
    return { courses: Number(courseCount.total), learners: Number(learnerCount.total), enrollments: Number(enrollmentCount.total) };
  }
  courses() { return this.database.db.select().from(courses).orderBy(desc(courses.createdAt)); }
  learners(courseId: string) {
    return this.database.db.select({ enrollment: enrollments, learner: { id: users.id, name: users.name, email: users.email } }).from(enrollments).innerJoin(users, eq(enrollments.userId, users.id)).where(eq(enrollments.courseId, courseId)).orderBy(desc(enrollments.enrolledAt));
  }
  users() { return this.database.db.select({ id: users.id, email: users.email, name: users.name, preferredLocale: users.preferredLocale, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(100); }
  certificates() { return this.database.db.select({ certificate: certificates, learner: { id: users.id, name: users.name, email: users.email }, course: { id: courses.id, title: courses.title } }).from(certificates).innerJoin(users, eq(certificates.userId, users.id)).innerJoin(courses, eq(certificates.courseId, courses.id)).orderBy(desc(certificates.issuedAt)).limit(100); }
  subscriptions() { return this.database.db.select({ subscription: subscriptions, plan: plans, learner: { id: users.id, name: users.name, email: users.email } }).from(subscriptions).innerJoin(plans, eq(subscriptions.planId, plans.id)).innerJoin(users, eq(subscriptions.userId, users.id)).orderBy(desc(subscriptions.createdAt)).limit(100); }
  async adminSummary() {
    const [userCount] = await this.database.db.select({ total: count(users.id) }).from(users);
    const [courseCount] = await this.database.db.select({ total: count(courses.id) }).from(courses);
    const [certificateCount] = await this.database.db.select({ total: count(certificates.id) }).from(certificates);
    const teachers = await this.database.db.select({ total: count(roles.userId) }).from(roles).where(eq(roles.role, 'teacher'));
    return { users: Number(userCount.total), courses: Number(courseCount.total), certificates: Number(certificateCount.total), teachers: Number(teachers[0]?.total || 0) };
  }
}

@Controller('teacher')
@UseGuards(RolesGuard)
@Roles('teacher', 'admin', 'super_admin')
class TeacherController {
  constructor(private readonly management: ManagementService) {}
  @Get('dashboard') dashboard() { return this.management.teacherSummary(); }
  @Get('courses') courses() { return this.management.courses(); }
  @Get('courses/:courseId/learners') learners(@Param('courseId') courseId: string) { return this.management.learners(courseId); }
  @Post('courses') createCourse(@Body() body: { slug: string; title: string; description?: string; category: string; language?: string; level?: string; published?: boolean }) { return this.management.createCourse(body); }
  @Post('courses/:courseId/modules') createModule(@Param('courseId') courseId: string, @Body() body: { title: string; position?: number }) { return this.management.createModule(courseId, body); }
  @Post('modules/:moduleId/lessons') createLesson(@Param('moduleId') moduleId: string, @Body() body: { title: string; type?: 'video' | 'text' | 'quiz' | 'practical' | 'exam'; content?: string; mediaUrl?: string; position?: number; durationMinutes?: number }) { return this.management.createLesson(moduleId, body); }
}

@Controller('admin')
@UseGuards(RolesGuard)
@Roles('admin', 'super_admin')
class AdminController {
  constructor(private readonly management: ManagementService) {}
  @Get('dashboard') dashboard() { return this.management.adminSummary(); }
  @Get('users') users() { return this.management.users(); }
  @Get('certificates') certificates() { return this.management.certificates(); }
  @Get('subscriptions') subscriptions() { return this.management.subscriptions(); }
}

@Module({ controllers: [TeacherController, AdminController], providers: [ManagementService, RolesGuard] })
export class ManagementModule {}
