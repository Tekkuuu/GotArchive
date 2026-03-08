import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { env } from '$env/dynamic/private';

if (!env.VITE_DATABASE_URL) throw new Error('VITE_DATABASE_URL is not set');
const pool = new Pool({ connectionString: env.VITE_DATABASE_URL });

export const db = drizzle(pool);

// Schema exports
export * as schema from './schema';

// Type exports
export type * from './types';

// Drizzle helper exports for convenient imports
export { eq, and, or, ne, inArray, not, isNull, isNotNull, sql } from 'drizzle-orm';
export { desc, asc } from 'drizzle-orm';
