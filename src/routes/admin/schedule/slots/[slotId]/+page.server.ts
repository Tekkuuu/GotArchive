import { db, schema, eq, asc, and } from '$lib/server/db';
import { error, fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { formSchema } from '../util';
import { AppError, ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';

export const load: PageServerLoad = async ({ params }) => {
	const slotId = params.slotId;

	// Load the slot with its platforms
	const slotData = await db
		.select({
			slot: schema.scheduleSlot,
			platform: schema.platform
		})
		.from(schema.scheduleSlot)
		.leftJoin(
			schema.scheduleSlotPlatform,
			eq(schema.scheduleSlot.scheduleSlotId, schema.scheduleSlotPlatform.scheduleSlotId)
		)
		.leftJoin(
			schema.platform,
			eq(schema.scheduleSlotPlatform.platformId, schema.platform.platformId)
		)
		.where(eq(schema.scheduleSlot.scheduleSlotId, slotId));

	if (slotData.length === 0) {
		throw error(404, 'Schedule slot not found');
	}

	const slot = slotData[0].slot;
	const platforms = slotData.filter((row) => row.platform).map((row) => row.platform!);

	// Find the anime season if anime is set
	let animeSeasonId: string | null = null;
	if (slot.animeId && slot.startingSequence) {
		const season = await db
			.select()
			.from(schema.animeSeason)
			.where(
				and(
					eq(schema.animeSeason.animeId, slot.animeId),
					eq(schema.animeSeason.sequence, slot.startingSequence)
				)
			)
			.limit(1);
		animeSeasonId = season[0]?.animeSeasonId ?? null;
	}

	// Prepare form data
	const formData = {
		...slot,
		animeSeasonId,
		platforms: platforms.map((p) => ({ platformId: p.platformId })),
		duplicateToDays: [] // Not used for editing
	};

	const form = await superValidate(formData, zod4(formSchema));

	// Load all anime and seasons for selection
	const anime = await db.select().from(schema.anime).orderBy(asc(schema.anime.titleNative));
	const animeSeasons = await db
		.select()
		.from(schema.animeSeason)
		.orderBy(asc(schema.animeSeason.animeId), asc(schema.animeSeason.sequence));
	const allPlatforms = await db.select().from(schema.platform).orderBy(asc(schema.platform.name));

	return { form, slot, anime, animeSeasons, platforms: allPlatforms };
};

export const actions: Actions = {
	update: async ({ request, url, params }) => {
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

				const finalSlotData = {
					...slotData,
					animeId: animeId || slotData.animeId,
					startingSequence: startingSequence || slotData.startingSequence
				};

				// Update the slot
				await tx
					.update(schema.scheduleSlot)
					.set(finalSlotData)
					.where(eq(schema.scheduleSlot.scheduleSlotId, params.slotId));

				// Delete existing platforms and insert new ones
				await tx
					.delete(schema.scheduleSlotPlatform)
					.where(eq(schema.scheduleSlotPlatform.scheduleSlotId, params.slotId));

				if (platforms.length > 0) {
					const platformData = platforms.map((p) => ({
						scheduleSlotId: params.slotId,
						platformId: p.platformId
					}));
					await tx.insert(schema.scheduleSlotPlatform).values(platformData);
				}
			});

			throw redirect(303, '/admin/schedule/slots');
		} catch (err) {
			if (err instanceof Response) throw err;

			if (!(err instanceof AppError)) {
				logger.error({
					msg: 'Unexpected error in edit schedule slot form',
					url: url.pathname,
					form: 'edit-schedule-slot',
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
	},

	delete: async ({ url, params }) => {
		try {
			await db
				.delete(schema.scheduleSlot)
				.where(eq(schema.scheduleSlot.scheduleSlotId, params.slotId));

			throw redirect(303, '/admin/schedule/slots');
		} catch (err) {
			if (err instanceof Response) throw err;

			logger.error({
				msg: 'Unexpected error in delete schedule slot action',
				url: url.pathname,
				action: 'delete-schedule-slot',
				error:
					err instanceof Error
						? {
								name: err.name,
								message: err.message,
								stack: err.stack
							}
						: err
			});

			if (err instanceof AppError) {
				return fail(err.httpStatus, { text: err.message });
			} else if (err instanceof Error) {
				return fail(500, { text: err.message });
			} else {
				return fail(500, { text: 'Unexpected error occurred' });
			}
		}
	}
};
