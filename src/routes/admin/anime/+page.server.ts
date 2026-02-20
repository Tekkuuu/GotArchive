import type { PageServerLoad, Actions } from './$types';
import {
	db,
	schema,
	type AnimeLink,
	type AnimeSeason,
	type AnimeSeasonMetadata,
	type Genre
} from '$lib/server/db';
import { count, eq, inArray, sql } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
	NewAnimeFormSchema,
	AnimeUpdateFormSchema,
	NewSeasonFormSchema,
	DeleteAnimeFormSchema
} from '$lib/schemas';
import { AppError, ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';
import _ from 'lodash';

export const load: PageServerLoad = async () => {
	const anime = await db
		.select({
			series: schema.anime,
			genres: sql<Array<Genre>>`
			array_remove(
				array_agg(distinct json_build_object('genreId', ${schema.genre.genreId}, 'name', ${schema.genre.name})::jsonb),
				null
			)
		`.as('genres'),
			links: sql<Array<AnimeLink>>`
      array_remove(
        array_agg(distinct json_build_object(
          'url', ${schema.animeLink.url},
          'platformId', ${schema.animeLink.platformId},
          'note', ${schema.animeLink.note}
        )::jsonb),
        null
      )
      `.as('links'),
			seasons: sql<Array<AnimeSeason & Omit<AnimeSeasonMetadata, 'animeSeasonId'>>>`
			array_remove(
				array_agg(
					distinct json_build_object(
						'animeSeasonId', ${schema.animeSeason.animeSeasonId},
						'sequence', ${schema.animeSeason.sequence},
						'format', ${schema.animeSeason.format},
						'titleNative', ${schema.animeSeason.titleNative},
						'titleRomaji', ${schema.animeSeason.titleRomaji},
						'titleEnglish', ${schema.animeSeason.titleEnglish},
						'shortTitle', ${schema.animeSeason.shortTitle},
						'season', ${schema.animeSeason.season},
						'year', ${schema.animeSeason.year},
						'episodes', ${schema.animeSeason.episodes},
						'episodeProgress', ${schema.animeSeason.episodeProgress},
            'anilistId', ${schema.animeSeasonMetadata.anilistId},
            'malId', ${schema.animeSeasonMetadata.malId},
            'note', ${schema.animeSeasonMetadata.note}
					)::jsonb
				),
				null
			)
		`.as('seasons')
		})
		.from(schema.anime)
		.leftJoin(schema.animeLink, eq(schema.anime.animeId, schema.animeLink.animeId))
		.leftJoin(schema.animeGenre, eq(schema.anime.animeId, schema.animeGenre.animeId))
		.leftJoin(schema.genre, eq(schema.animeGenre.genreId, schema.genre.genreId))
		.leftJoin(schema.animeSeason, eq(schema.anime.animeId, schema.animeSeason.animeId))
		.leftJoin(
			schema.animeSeasonMetadata,
			eq(schema.animeSeason.animeSeasonId, schema.animeSeasonMetadata.animeSeasonId)
		)
		.groupBy(schema.anime.animeId);

	const genres = await db.select().from(schema.genre);
	const platforms = await db.select().from(schema.platform);

	const addAnimeForm = await superValidate(zod4(NewAnimeFormSchema));
	const addSeasonForm = await superValidate(zod4(NewSeasonFormSchema));
	const editAnimeForm = await superValidate(zod4(AnimeUpdateFormSchema));
	const deleteAnimeForm = await superValidate(zod4(DeleteAnimeFormSchema));

	return { anime, genres, platforms, addAnimeForm, addSeasonForm, editAnimeForm, deleteAnimeForm };
};

export const actions: Actions = {
	createAnime: async ({ request, url }) => {
		const form = await superValidate(request, zod4(NewAnimeFormSchema));

		if (!form.valid) {
			return fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.transaction(async (tx) => {
				const animeId = (
					await tx
						.insert(schema.anime)
						.values(_.omit(form.data, ['links', 'genres']))
						.returning()
				).at(0)?.animeId;

				if (!animeId) {
					throw new AppError(ERROR_CODES.db.INSERT_FAILED, {
						context: { table: 'anime', operation: 'createAnime' }
					});
				}

				const genresInDB = await tx.select().from(schema.genre);
				const genreToInsert = form.data.genres.filter(
					(g) => !genresInDB.map((gDB) => gDB.genreId).includes(g.genreId)
				);

				if (genreToInsert.length > 0) {
					await tx.insert(schema.genre).values(genreToInsert);
				}

				if (form.data.genres.length > 0) {
					await tx
						.insert(schema.animeGenre)
						.values(form.data.genres.map((g) => ({ genreId: g.genreId, animeId })));
				}

				if (form.data.links.length > 0) {
					await tx.insert(schema.animeLink).values(form.data.links.map((l) => ({ animeId, ...l })));
				}
			});

			return { success: true };
		} catch (err) {
			if (err instanceof AppError) {
				logger.error('createAnime: DB insert returned no ID', {
					code: err.code,
					context: { action: 'createAnime' }
				});
				return fail(err.httpStatus, { form, text: err.message });
			}
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'createAnime', url: url.pathname }
			});
		}
	},
	updateAnime: async ({ request }) => {
		const form = await superValidate(request, zod4(AnimeUpdateFormSchema));

		if (!form.valid) {
			return fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.transaction(async (tx) => {
				await tx
					.update(schema.anime)
					.set({
						titleNative: form.data.titleNative || '',
						titleRomaji: form.data.titleRomaji || null,
						titleEnglish: form.data.titleEnglish || null,
						shortTitle: form.data.shortTitle || null,
						logoUrl: form.data.logoUrl || null
					})
					.where(eq(schema.anime.animeId, form.data.animeId));

				if (form.data.genres.length > 0) {
					await tx
						.delete(schema.animeGenre)
						.where(eq(schema.animeGenre.animeId, form.data.animeId));
					await tx
						.insert(schema.animeGenre)
						.values(
							form.data.genres.map((g) => ({ genreId: g.genreId, animeId: form.data.animeId }))
						);
				}

				if (form.data.links.length > 0) {
					await tx.delete(schema.animeLink).where(eq(schema.animeLink.animeId, form.data.animeId));
					await tx
						.insert(schema.animeLink)
						.values(form.data.links.map((l) => ({ animeId: form.data.animeId, ...l })));
				}
			});

			return { success: true };
		} catch (err) {
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'updateAnime' }
			});
		}
	},
	deleteAnime: async ({ request }) => {
		const form = await superValidate(request, zod4(DeleteAnimeFormSchema));

		if (!form.valid) return fail(400, { form, text: 'Anime ID is required' });

		try {
			const seasons = await db
				.select()
				.from(schema.animeSeason)
				.where(eq(schema.animeSeason.animeId, form.data.animeId));

			const scheduled = await db
				.select({ count: count() })
				.from(schema.scheduleEntryAnimeSeason)
				.where(
					inArray(
						schema.scheduleEntryAnimeSeason.animeSeasonId,
						seasons.map((s) => s.animeSeasonId)
					)
				);

			const hasProgress = seasons.some((s) => s.episodeProgress > 0);
			const isScheduled = scheduled[0]?.count > 0;
			if (hasProgress || isScheduled) {
				return fail(400, {
					form,
					text: 'Cannot delete anime with seasons that have progress or are in schedule'
				});
			}

			for (const season of seasons) {
				const inSchedule = await db
					.select()
					.from(schema.scheduleEntryAnimeSeason)
					.where(eq(schema.scheduleEntryAnimeSeason.animeSeasonId, season.animeSeasonId))
					.limit(1);

				if (inSchedule.length > 0 || season.episodeProgress > 0) {
					return fail(400, {
						form,
						text: 'Cannot delete anime with seasons that have progress or are in schedule'
					});
				}
			}

			await db.transaction(async (tx) => {
				for (const season of seasons) {
					await tx
						.delete(schema.animeSeasonMetadata)
						.where(eq(schema.animeSeasonMetadata.animeSeasonId, season.animeSeasonId));
					await tx
						.delete(schema.animeSeason)
						.where(eq(schema.animeSeason.animeSeasonId, season.animeSeasonId));
				}
				await tx.delete(schema.animeGenre).where(eq(schema.animeGenre.animeId, form.data.animeId));
				await tx.delete(schema.animeLink).where(eq(schema.animeLink.animeId, form.data.animeId));
				await tx.delete(schema.anime).where(eq(schema.anime.animeId, form.data.animeId));
			});

			logger.warn('deleteAnime: anime and all associated data permanently deleted', {
				animeId: form.data.animeId,
				seasonCount: seasons.length
			});
			return { success: true };
		} catch (err) {
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'deleteAnime' }
			});
		}
	},
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
					context: { action: 'createSeason' }
				});
				return fail(err.httpStatus, { form, text: err.message });
			}
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
				cause: err,
				context: { action: 'createSeason', url: url.pathname }
			});
		}
	}
};
