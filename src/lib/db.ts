import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/db/schema';

const url = process.env.TURSO_DATABASE_URL ?? 'file:./local.db';
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({
  url,
  authToken: authToken || undefined,
});

export const db = drizzle(client, { schema });

/** Generate a CUID-like id for new rows (SQLite compatible). */
export function createId(): string {
  return crypto.randomUUID();
}

/** ISO string for createdAt/updatedAt. */
export function now(): string {
  return new Date().toISOString();
}
