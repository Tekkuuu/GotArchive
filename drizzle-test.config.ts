import { defineConfig } from 'drizzle-kit';
if (!process.env.DATABASE_URL_TEST) throw new Error('DATABASE_URL_TEST is not set');

export default defineConfig({
  schema: './src/lib/server/db/shared/schema.ts',

  dbCredentials: {
    url: process.env.DATABASE_URL_TEST
  },

  verbose: true,
  strict: true,
  dialect: 'postgresql'
});
