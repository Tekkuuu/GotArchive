import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
const pool = new Pool({ connectionString: env.DATABASE_URL });

export const db = drizzle(pool);

export * as schema from './schema';

export type * from './types';

export { eq, and, or, ne, inArray, not, isNull, isNotNull, sql } from 'drizzle-orm';
export { desc, asc } from 'drizzle-orm';
