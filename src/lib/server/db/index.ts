import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';

if (!env.VITE_DATABASE_URL) throw new Error('VITE_DATABASE_URL is not set');
const sql = neon(env.VITE_DATABASE_URL);

export const db = drizzle(sql);

// Schema exports
export * as schema from './shared/schema';

// Type exports
export type * from './shared/types';

// Drizzle helper exports for convenient imports
export { eq, and, or, inArray, not, isNull, isNotNull, sql } from 'drizzle-orm';
export { desc, asc } from 'drizzle-orm';

// Error handling
export { handleError } from './shared/errorHandler';
