import type { PageServerLoad } from './$types';
import { schema, db, eq, desc, sql } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const schedules = await db
		.select({
			scheduleId: schema.schedule.scheduleId,
			year: schema.schedule.year,
			week: schema.schedule.week,
			note: schema.schedule.note,
			preview: schema.schedule.preview,
			entryCount: sql<number>`COUNT(${schema.scheduleEntry.scheduleEntryId})::int`
		})
		.from(schema.schedule)
		.leftJoin(schema.scheduleEntry, eq(schema.schedule.scheduleId, schema.scheduleEntry.scheduleId))
		.groupBy(
			schema.schedule.scheduleId,
			schema.schedule.year,
			schema.schedule.week,
			schema.schedule.note,
			schema.schedule.preview
		)
		.orderBy(desc(schema.schedule.year), desc(schema.schedule.week));

	return { schedules };
};
