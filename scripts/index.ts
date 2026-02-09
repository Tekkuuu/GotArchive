import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

if (!process.env.ADMIN_DATABASE_URL) throw new Error('ADMIN_DATABASE_URL is not set');
const client = postgres(process.env.ADMIN_DATABASE_URL, { prepare: false });

export const db = drizzle(client);
export * as schema from './schema';
