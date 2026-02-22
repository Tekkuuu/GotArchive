import { schema, db, eq } from '$lib/server/db';
import type { Infer } from 'sveltekit-superforms';
import type { AddScheduleEntrySchema, EditScheduleEntrySchema } from '$lib/schemas';

export async function insertScheduleEntry(
	data: Infer<typeof AddScheduleEntrySchema>,
	scheduleId: string
): Promise<void> {
	const [newEntry] = await db
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
		for (const anime of data.anime) {
			await db.insert(schema.scheduleEntryAnimeSeason).values({
				scheduleEntryId: newEntry.scheduleEntryId,
				animeSeasonId: anime.animeSeasonId,
				episodes: anime.episodes
			});
		}
	}

	if (data.platforms && data.platforms.length > 0) {
		for (const platformId of data.platforms) {
			await db.insert(schema.scheduleEntryPlatform).values({
				scheduleEntryId: newEntry.scheduleEntryId,
				platformId
			});
		}
	}
}

export async function updateScheduleEntry(
	data: Infer<typeof EditScheduleEntrySchema>
): Promise<void> {
	await db
		.update(schema.scheduleEntry)
		.set({
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
		await db
			.delete(schema.scheduleEntryAnimeSeason)
			.where(eq(schema.scheduleEntryAnimeSeason.scheduleEntryId, data.scheduleEntryId));

		if (data.anime.length > 0) {
			for (const anime of data.anime) {
				await db.insert(schema.scheduleEntryAnimeSeason).values({
					scheduleEntryId: data.scheduleEntryId,
					animeSeasonId: anime.animeSeasonId,
					episodes: anime.episodes
				});
			}
		}
	}

	if (data.platforms !== null) {
		await db
			.delete(schema.scheduleEntryPlatform)
			.where(eq(schema.scheduleEntryPlatform.scheduleEntryId, data.scheduleEntryId));

		if (data.platforms.length > 0) {
			for (const platformId of data.platforms) {
				await db.insert(schema.scheduleEntryPlatform).values({
					scheduleEntryId: data.scheduleEntryId,
					platformId
				});
			}
		}
	}
}
