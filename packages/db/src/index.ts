import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema.js';
export * from './schema.js';

export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error('DATABASE_URL is required');
  const client = postgres(url, { max: Number(process.env.DB_POOL_MAX || 5), prepare: false, ssl: url.includes('neon.tech') ? 'require' : undefined });
  return { db: drizzle(client, { schema }), client };
}

export type Db = ReturnType<typeof createDb>['db'];
