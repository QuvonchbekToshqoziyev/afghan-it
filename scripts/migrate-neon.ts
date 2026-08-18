import { config } from 'dotenv';
config({ path: '.env.local' });
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { drizzle } from 'drizzle-orm/postgres-js';

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL_UNPOOLED or DATABASE_URL is required');
  const client = postgres(url, { max: 1, prepare: false, ssl: url.includes('neon.tech') ? 'require' : undefined });
  await migrate(drizzle(client), { migrationsFolder: 'packages/db/drizzle' });
  await client.end();
  console.log('Neon migrations applied');
}
main().catch((error) => { console.error(error); process.exit(1); });
