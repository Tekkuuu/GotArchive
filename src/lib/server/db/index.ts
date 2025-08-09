import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '$env/dynamic/private';
if (!env.ADMIN_DATABASE_URL) throw new Error('ADMIN_DATABASE_URL is not set');
const client = postgres(env.ADMIN_DATABASE_URL, { prepare: false });

export const db = drizzle(client);
export * as schema from './shared/schema';
export type * from './shared/types';
export { services } from './services';

// Custom types
export type * from './customMethods/types';
