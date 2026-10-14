import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type D1Database = import('@cloudflare/workers-types').D1Database;

export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type DrizzleDb = ReturnType<typeof getDb>;
