import { defineConfig } from 'drizzle-kit';

if (!process.env.SUPABASE_DATABASE_URL) throw new Error('SUPABASE_DATABASE_URL is not set');

export default defineConfig({
	schema: './scripts/schema.ts',
	dbCredentials: {
		url: process.env.SUPABASE_DATABASE_URL!
	},
	verbose: true,
	strict: true,
	dialect: 'postgresql',
	out: './scripts/migrations/',
	schemaFilter: ['public']
});
