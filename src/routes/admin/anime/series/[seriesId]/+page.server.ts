import type { PageServerLoad, Actions } from './$types';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { NewSeasonFormSchema, EditSeasonFormSchema } from '$lib/schemas';
import { AppError, ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';
import _ from 'lodash';

export const load: PageServerLoad = async ({ params }) => {
	const seriesId = params.seriesId;

	const anime = await db
		.select()
		.from(schema.anime)
		.where(eq(schema.anime.animeId, seriesId))
		.limit(1);

	if (anime.length === 0) {
		throw error(404, 'Anime not found');
	}

	const seasons = await db
		.select({
			data: schema.animeSeason,
			metadata: schema.animeSeasonMetadata
		})
		.from(schema.animeSeason)
		.leftJoin(
			schema.animeSeasonMetadata,
			eq(schema.animeSeasonMetadata.animeSeasonId, schema.animeSeason.animeSeasonId)
		)
		.where(eq(schema.animeSeason.animeId, seriesId))
		.orderBy(schema.animeSeason.sequence);

	const addSeasonForm = await superValidate(zod4(NewSeasonFormSchema));
	const editSeasonForm = await superValidate(zod4(EditSeasonFormSchema));

	return {
		anime: anime[0],
		seasons,
		addSeasonForm,
		editSeasonForm
	};
};

export const actions: Actions = {
	createSeason: async ({ request, url }) => {
		const form = await superValidate(request, zod4(NewSeasonFormSchema));

		if (!form.valid) {
			return fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.transaction(async (tx) => {
				const animeSeasonData = _.pick(form.data, [
					'animeId',
					'sequence',
					'format',
					'titleNative',
					'titleRomaji',
					'titleEnglish',
					'shortTitle',
					'season',
					'year',
					'episodes'
				]);

				const animeSeasonId = (
					await tx.insert(schema.animeSeason).values(animeSeasonData).returning()
				).at(0)?.animeSeasonId;

				if (!animeSeasonId) {
					throw new AppError(ERROR_CODES.db.INSERT_FAILED, {
						context: { table: 'animeSeason', operation: 'createSeason' }
					});
				}

				await tx.insert(schema.animeSeasonMetadata).values({
					animeSeasonId,
					anilistId: form.data.anilistId,
					malId: form.data.malId,
					note: form.data.note
				});
			});

			return { success: true };
		} catch (err) {
			if (err instanceof AppError) {
				logger.error('createSeason: DB insert returned no ID', {
					code: err.code,
					context: { action: 'createSeason', seriesId: url.pathname }
				});
				return fail(err.httpStatus, { form, text: err.message });
			}
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'createSeason', url: url.pathname }
			});
		}
	},
	updateSeason: async ({ request }) => {
		const form = await superValidate(request, zod4(EditSeasonFormSchema));

		if (!form.valid) {
			return fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.transaction(async (tx) => {
				await tx
					.update(schema.animeSeason)
					.set({
						sequence: form.data.sequence,
						format: form.data.format as never,
						titleNative: form.data.titleNative,
						titleRomaji: form.data.titleRomaji,
						titleEnglish: form.data.titleEnglish,
						shortTitle: form.data.shortTitle,
						season: form.data.season as never,
						year: form.data.year,
						episodes: form.data.episodes
					})
					.where(eq(schema.animeSeason.animeSeasonId, form.data.animeSeasonId));

				await tx
					.update(schema.animeSeasonMetadata)
					.set({
						anilistId: form.data.anilistId,
						malId: form.data.malId,
						note: form.data.note
					})
					.where(eq(schema.animeSeasonMetadata.animeSeasonId, form.data.animeSeasonId));
			});

			return { success: true };
		} catch (err) {
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'updateSeason' }
			});
		}
	},
	deleteSeason: async ({ request }) => {
		const formData = await request.formData();
		const seasonId = formData.get('seasonId') as string;

		if (!seasonId) {
			return fail(400, { text: 'Season ID is required' });
		}

		try {
			const inSchedule = await db
				.select()
				.from(schema.scheduleEntryAnimeSeason)
				.where(eq(schema.scheduleEntryAnimeSeason.animeSeasonId, seasonId))
				.limit(1);

			if (inSchedule.length > 0) {
				return fail(400, { text: 'Cannot delete season that is used in schedule' });
			}

			const season = await db
				.select()
				.from(schema.animeSeason)
				.where(eq(schema.animeSeason.animeSeasonId, seasonId))
				.limit(1);

			if (season.length > 0 && season[0].episodeProgress > 0) {
				return fail(400, { text: 'Cannot delete season with progress' });
			}

			await db.transaction(async (tx) => {
				await tx
					.delete(schema.animeSeasonMetadata)
					.where(eq(schema.animeSeasonMetadata.animeSeasonId, seasonId));
				await tx.delete(schema.animeSeason).where(eq(schema.animeSeason.animeSeasonId, seasonId));
			});

			return { success: true };
		} catch (err) {
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'deleteSeason' }
			});
		}
	}
};
