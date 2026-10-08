import { existsSync } from 'node:fs';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, isNotNull } from 'drizzle-orm';
import { Pool } from 'pg';
import { schedule } from '../src/lib/server/db/schema';
import { htmlToBbcode, isLegacyHtmlNote } from './htmlToBbcode';

if (existsSync('.env')) process.loadEnvFile('.env');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	console.error('DATABASE_URL is not set.');
	process.exit(1);
}

const pool = new Pool({ connectionString });
const db = drizzle(pool);

const rows = await db
	.select({ scheduleId: schedule.scheduleId, note: schedule.note })
	.from(schedule)
	.where(isNotNull(schedule.note));

let converted = 0;
for (const row of rows) {
	if (!row.note || !isLegacyHtmlNote(row.note)) continue;

	await db
		.update(schedule)
		.set({ note: htmlToBbcode(row.note) })
		.where(eq(schedule.scheduleId, row.scheduleId));
	converted++;
}

console.log(`Converted ${converted} of ${rows.length} notes to BBCode.`);

await pool.end();
