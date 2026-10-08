import type { PageServerLoad } from './$types';
import { db, schema, eq, asc, sql } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const slots = await db
		.select({
			slot: schema.scheduleSlot,
			anime: schema.anime,
			platforms: sql<
				Array<string>
			>`array_agg(${schema.platform.name} ORDER BY ${schema.platform.name} ASC)`
		})
		.from(schema.scheduleSlot)
		.leftJoin(schema.anime, eq(schema.scheduleSlot.animeId, schema.anime.animeId))
		.leftJoin(
			schema.scheduleSlotPlatform,
			eq(schema.scheduleSlot.scheduleSlotId, schema.scheduleSlotPlatform.scheduleSlotId)
		)
		.leftJoin(
			schema.platform,
			eq(schema.scheduleSlotPlatform.platformId, schema.platform.platformId)
		)
		.groupBy(schema.scheduleSlot.scheduleSlotId, schema.anime.animeId)
		.orderBy(asc(schema.scheduleSlot.dayOfWeek), asc(schema.scheduleSlot.time));

	const anime = await db.select().from(schema.anime).orderBy(asc(schema.anime.titleNative));
	const platforms = await db.select().from(schema.platform).orderBy(asc(schema.platform.name));

	return {
		slots,
		anime,
		platforms
	};
};
