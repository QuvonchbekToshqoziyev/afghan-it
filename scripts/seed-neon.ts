import { config } from 'dotenv';
config({ path: '.env.local' });
import { createDb, courses, modules, lessons, plans } from '@afghan-it/db';

async function main() {
  const { db, client } = createDb(process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL);
  const [course] = await db.insert(courses).values({ slug: 'frontend-development', title: 'Frontend Development', description: 'React va zamonaviy web dasturlashni noldan o‘rganing.', category: 'IT', language: 'uz', level: 'beginner', published: true }).onConflictDoNothing().returning();
  if (course) {
    const [module] = await db.insert(modules).values({ courseId: course.id, title: 'Web asoslari', position: 1 }).returning();
    await db.insert(lessons).values([{ moduleId: module.id, title: 'HTML va CSS asoslari', type: 'video', position: 1, durationMinutes: 25 }, { moduleId: module.id, title: 'Birinchi amaliy vazifa', type: 'practical', position: 2, durationMinutes: 35 }]);
  }
  await db.insert(plans).values([{ slug: 'free', name: 'Bepul', priceCents: 0, currency: 'USD', features: ['Birinchi kurslar', 'AI Mentor sinovi'] }, { slug: 'professional', name: 'Professional', priceCents: 990, currency: 'USD', features: ['Barcha kurslar', 'Sertifikatlar', 'AI Mentor'] }]).onConflictDoNothing();
  await client.end();
  console.log('Neon seed complete');
}
main().catch((error) => { console.error(error); process.exit(1); });
