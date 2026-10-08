import { schema, db, eq } from '$lib/server/db';
import type { z } from 'zod/v4';
import type { AddScheduleEntrySchema, EditScheduleEntrySchema } from '$lib/schemas';

export async function insertScheduleEntry(
	data: z.infer<typeof AddScheduleEntrySchema>,
	scheduleId: string
): Promise<void> {
	await db.transaction(async (tx) => {
		const [newEntry] = await tx
			.insert(schema.scheduleEntry)
			.values({
				scheduleId,
				type: data.type,
				date: data.date,
				time: data.time,
				note: data.note,
				logoUrl: data.logoUrl,
				title: data.title,
				description: data.description,
				cancelledText: data.cancelledText,
				isCancelled: data.isCancelled
			})
			.returning();

		if (data.anime && data.anime.length > 0) {
			await tx.insert(schema.scheduleEntryAnimeSeason).values(
				data.anime.map((anime) => ({
					scheduleEntryId: newEntry.scheduleEntryId,
					animeSeasonId: anime.animeSeasonId,
					episodes: anime.episodes
				}))
			);
		}

		if (data.platforms && data.platforms.length > 0) {
			await tx.insert(schema.scheduleEntryPlatform).values(
				data.platforms.map((platformId) => ({
					scheduleEntryId: newEntry.scheduleEntryId,
					platformId
				}))
			);
		}
	});
}

export async function updateScheduleEntry(
	data: z.infer<typeof EditScheduleEntrySchema>
): Promise<void> {
	await db.transaction(async (tx) => {
		await tx
			.update(schema.scheduleEntry)
			.set({
				date: data.date,
				time: data.time,
				title: data.title,
				description: data.description,
				logoUrl: data.logoUrl,
				note: data.note,
				cancelledText: data.cancelledText,
				isCancelled: data.isCancelled
			})
			.where(eq(schema.scheduleEntry.scheduleEntryId, data.scheduleEntryId));

		if (data.anime !== null) {
			await tx
				.delete(schema.scheduleEntryAnimeSeason)
				.where(eq(schema.scheduleEntryAnimeSeason.scheduleEntryId, data.scheduleEntryId));

			if (data.anime.length > 0) {
				await tx.insert(schema.scheduleEntryAnimeSeason).values(
					data.anime.map((anime) => ({
						scheduleEntryId: data.scheduleEntryId,
						animeSeasonId: anime.animeSeasonId,
						episodes: anime.episodes
					}))
				);
			}
		}

		if (data.platforms !== null) {
			await tx
				.delete(schema.scheduleEntryPlatform)
				.where(eq(schema.scheduleEntryPlatform.scheduleEntryId, data.scheduleEntryId));

			if (data.platforms.length > 0) {
				await tx.insert(schema.scheduleEntryPlatform).values(
					data.platforms.map((platformId) => ({
						scheduleEntryId: data.scheduleEntryId,
						platformId
					}))
				);
			}
		}
	});
}
