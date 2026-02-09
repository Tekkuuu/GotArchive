import { db, schema, eq, asc } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Load all schedule slots with their platforms and anime info
	const slots = await db
		.select({
			slot: schema.scheduleSlot,
			anime: schema.anime,
			platforms: schema.platform
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
		.orderBy(asc(schema.scheduleSlot.dayOfWeek), asc(schema.scheduleSlot.time));

	// Group slots and aggregate platforms
	const groupedSlots = slots.reduce(
		(acc, row) => {
			const slotId = row.slot.scheduleSlotId;

			if (!acc[slotId]) {
				acc[slotId] = {
					...row.slot,
					anime: row.anime,
					platforms: []
				};
			}

			if (row.platforms) {
				acc[slotId].platforms.push(row.platforms);
			}

			return acc;
		},
		{} as Record<string, any>
	);

	const processedSlots = Object.values(groupedSlots);

	return {
		slots: processedSlots
	};
};
