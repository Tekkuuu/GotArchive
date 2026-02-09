import { db, schema, eq, asc } from '$lib/server/db';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { formSchema } from '../util';
import { AppError, ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';

export const load: PageServerLoad = async () => {
	const form = await superValidate(zod4(formSchema));

	// Load all anime
	const anime = await db.select().from(schema.anime).orderBy(asc(schema.anime.titleNative));

	// Load all anime seasons
	const animeSeasons = await db
		.select()
		.from(schema.animeSeason)
		.orderBy(asc(schema.animeSeason.animeId), asc(schema.animeSeason.sequence));

	const platforms = await db.select().from(schema.platform).orderBy(asc(schema.platform.name));

	return { form, anime, animeSeasons, platforms };
};

export const actions: Actions = {
	create: async ({ request, url }) => {
		const form = await superValidate(request, zod4(formSchema));

		if (!form.valid) {
			return fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.transaction(async (tx) => {
				const { duplicateToDays, platforms, animeSeasonId, ...slotData } = form.data;

				// Get anime info and sequence from season if anime season is selected
				let animeId: string | null = null;
				let startingSequence: number | null = null;
				if (animeSeasonId) {
					const season = await tx
						.select()
						.from(schema.animeSeason)
						.where(eq(schema.animeSeason.animeSeasonId, animeSeasonId))
						.limit(1);
					if (season[0]) {
						animeId = season[0].animeId;
						startingSequence = season[0].sequence;
					}
				}

				// Create array of days to create slots for (original day + duplicates)
				const daysToCreate = [slotData.dayOfWeek, ...duplicateToDays];

				// Create a slot for each day
				for (const dayOfWeek of daysToCreate) {
					const finalSlotData = {
						...slotData,
						dayOfWeek,
						animeId: animeId || slotData.animeId,
						startingSequence: startingSequence || slotData.startingSequence
					};

					const insertedSlot = (
						await tx.insert(schema.scheduleSlot).values(finalSlotData).returning()
					).at(0);

					if (!insertedSlot) {
						throw new AppError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, {
							context: { form: 'new-schedule-slot' }
						});
					}

					// Insert platforms if any
					if (platforms.length > 0) {
						const platformData = platforms.map((p) => ({
							scheduleSlotId: insertedSlot.scheduleSlotId,
							platformId: p.platformId
						}));
						await tx.insert(schema.scheduleSlotPlatform).values(platformData);
					}
				}
			});

			throw redirect(303, '/admin/schedule/slots');
		} catch (err) {
			if (err instanceof Response) throw err;

			// Log non-AppError exceptions
			if (!(err instanceof AppError)) {
				logger.error({
					msg: 'Unexpected error in new schedule slot form',
					url: url.pathname,
					form: 'new-schedule-slot',
					error:
						err instanceof Error
							? {
									name: err.name,
									message: err.message,
									stack: err.stack
								}
							: err
				});
			}

			if (err instanceof AppError) {
				return fail(err.httpStatus, { form, text: err.message });
			} else if (err instanceof Error) {
				return fail(500, { form, text: err.message });
			} else {
				return fail(500, { form, text: 'Unexpected error occurred' });
			}
		}
	}
};
