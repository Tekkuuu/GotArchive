import { command, form } from '$app/server';
import { error } from '@sveltejs/kit';
import { count, eq, inArray } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { AppError, ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';
import { requireStaff } from '$lib/server/auth';
import { parseEpisodeList } from '$lib/util/schedule/episodeProgressParser';
import {
	AnimeUpdateFormSchema,
	DeleteAnimeFormSchema,
	DeleteSeasonFormSchema,
	EditSeasonFormSchema,
	NewAnimeFormSchema,
	NewSeasonFormSchema
} from '$lib/schemas';

/** Anime admin operations. */

export const createAnime = form(NewAnimeFormSchema, async (data) => {
	await requireStaff();

	try {
		await db.transaction(async (tx) => {
			const animeId = (
				await tx
					.insert(schema.anime)
					.values({
						titleNative: data.titleNative,
						titleRomaji: data.titleRomaji || null,
						titleEnglish: data.titleEnglish || null,
						shortTitle: data.shortTitle || null,
						logoUrl: data.logoUrl || null
					})
					.returning()
			).at(0)?.animeId;

			if (!animeId) {
				throw new AppError(ERROR_CODES.db.INSERT_FAILED, {
					context: { table: 'anime', operation: 'createAnime' }
				});
			}

			const genresInDB = await tx.select().from(schema.genre);
			const existingIds = new Set(genresInDB.map((g) => g.genreId));
			const genreToInsert = data.genres.filter((g) => !existingIds.has(g.genreId));

			if (genreToInsert.length > 0) {
				await tx.insert(schema.genre).values(genreToInsert);
			}

			if (data.genres.length > 0) {
				await tx
					.insert(schema.animeGenre)
					.values(data.genres.map((g) => ({ genreId: g.genreId, animeId })));
			}

			if (data.links.length > 0) {
				await tx.insert(schema.animeLink).values(
					data.links.map((l) => ({
						animeId,
						url: l.url,
						platformId: l.platformId,
						note: l.note || null
					}))
				);
			}
		});
	} catch (err) {
		if (err instanceof AppError) {
			logger.error('createAnime: DB insert returned no ID', {
				code: err.code,
				context: { action: 'createAnime' }
			});
			error(err.httpStatus, err.message);
		}

		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'createAnime' }
		});
	}

	return { success: true as const };
});

export const updateAnime = form(AnimeUpdateFormSchema, async (data) => {
	await requireStaff();

	const { animeId } = data;

	try {
		await db.transaction(async (tx) => {
			await tx
				.update(schema.anime)
				.set({
					titleNative: data.titleNative || '',
					titleRomaji: data.titleRomaji || null,
					titleEnglish: data.titleEnglish || null,
					shortTitle: data.shortTitle || null,
					logoUrl: data.logoUrl || null
				})
				.where(eq(schema.anime.animeId, animeId));

			if (data.genres.length > 0) {
				await tx.delete(schema.animeGenre).where(eq(schema.animeGenre.animeId, animeId));
				await tx
					.insert(schema.animeGenre)
					.values(data.genres.map((g) => ({ genreId: g.genreId, animeId })));
			}

			// Reconcile links; empty clears.
			await tx.delete(schema.animeLink).where(eq(schema.animeLink.animeId, animeId));
			if (data.links.length > 0) {
				await tx.insert(schema.animeLink).values(
					data.links.map((l) => ({
						animeId,
						url: l.url,
						platformId: l.platformId,
						note: l.note || null
					}))
				);
			}
		});
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'updateAnime' }
		});
	}

	return { success: true as const };
});

export const createSeason = form(NewSeasonFormSchema, async (data) => {
	await requireStaff();

	try {
		await db.transaction(async (tx) => {
			const animeSeasonId = (
				await tx
					.insert(schema.animeSeason)
					.values({
						animeId: data.animeId,
						sequence: data.sequence,
						format: data.format,
						titleNative: data.titleNative,
						titleRomaji: data.titleRomaji || null,
						titleEnglish: data.titleEnglish || null,
						shortTitle: data.shortTitle || null,
						season: data.season || null,
						year: data.year ?? null,
						episodes: data.episodes ?? null,
						skippedEpisodes: parseEpisodeList(data.skippedEpisodes ?? '')
					})
					.returning()
			).at(0)?.animeSeasonId;

			if (!animeSeasonId) {
				throw new AppError(ERROR_CODES.db.INSERT_FAILED, {
					context: { table: 'animeSeason', operation: 'createSeason' }
				});
			}

			await tx.insert(schema.animeSeasonMetadata).values({
				animeSeasonId,
				anilistId: data.anilistId ?? null,
				malId: data.malId ?? null,
				note: data.note || null
			});
		});
	} catch (err) {
		if (err instanceof AppError) {
			logger.error('createSeason: DB insert returned no ID', {
				code: err.code,
				context: { action: 'createSeason' }
			});
			error(err.httpStatus, err.message);
		}

		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'createSeason' }
		});
	}

	return { success: true as const };
});

export const updateSeason = form(EditSeasonFormSchema, async (data) => {
	await requireStaff();

	try {
		await db.transaction(async (tx) => {
			await tx
				.update(schema.animeSeason)
				.set({
					sequence: data.sequence,
					format: data.format,
					titleNative: data.titleNative,
					titleRomaji: data.titleRomaji || null,
					titleEnglish: data.titleEnglish || null,
					shortTitle: data.shortTitle || null,
					season: data.season || null,
					year: data.year ?? null,
					episodes: data.episodes ?? null,
					episodeProgress: data.episodeProgress ?? 0,
					skippedEpisodes: parseEpisodeList(data.skippedEpisodes ?? '')
				})
				.where(eq(schema.animeSeason.animeSeasonId, data.animeSeasonId));

			await tx
				.update(schema.animeSeasonMetadata)
				.set({
					anilistId: data.anilistId ?? null,
					malId: data.malId ?? null,
					note: data.note || null
				})
				.where(eq(schema.animeSeasonMetadata.animeSeasonId, data.animeSeasonId));
		});
	} catch (err) {
		throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, {
			cause: err,
			context: { action: 'updateSeason' }
		});
	}

	return { success: true as const };
});

export const deleteAnime = command(DeleteAnimeFormSchema, async ({ animeId }) => {
	await requireStaff();

	const seasons = await db
		.select()
		.from(schema.animeSeason)
		.where(eq(schema.animeSeason.animeId, animeId));

	const hasProgress = seasons.some((s) => s.episodeProgress > 0);

	let isScheduled = false;
	if (seasons.length > 0) {
		const scheduled = await db
			.select({ count: count() })
			.from(schema.scheduleEntryAnimeSeason)
			.where(
				inArray(
					schema.scheduleEntryAnimeSeason.animeSeasonId,
					seasons.map((s) => s.animeSeasonId)
				)
			);
		isScheduled = (scheduled[0]?.count ?? 0) > 0;
	}

	if (hasProgress || isScheduled) {
		error(400, 'Cannot delete anime with seasons that have progress or are in schedule');
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
		await tx.delete(schema.animeGenre).where(eq(schema.animeGenre.animeId, animeId));
		await tx.delete(schema.animeLink).where(eq(schema.animeLink.animeId, animeId));
		await tx.delete(schema.anime).where(eq(schema.anime.animeId, animeId));
	});

	logger.warn('deleteAnime: anime and all associated data permanently deleted', {
		animeId,
		seasonCount: seasons.length
	});

	return { success: true as const };
});

export const deleteSeason = command(DeleteSeasonFormSchema, async ({ seasonId }) => {
	await requireStaff();

	const inSchedule = await db
		.select()
		.from(schema.scheduleEntryAnimeSeason)
		.where(eq(schema.scheduleEntryAnimeSeason.animeSeasonId, seasonId))
		.limit(1);

	if (inSchedule.length > 0) {
		error(400, 'Cannot delete season that is used in schedule');
	}

	const season = await db
		.select()
		.from(schema.animeSeason)
		.where(eq(schema.animeSeason.animeSeasonId, seasonId))
		.limit(1);

	if (season.length > 0 && season[0].episodeProgress > 0) {
		error(400, 'Cannot delete season with progress');
	}

	await db.transaction(async (tx) => {
		await tx
			.delete(schema.animeSeasonMetadata)
			.where(eq(schema.animeSeasonMetadata.animeSeasonId, seasonId));
		await tx.delete(schema.animeSeason).where(eq(schema.animeSeason.animeSeasonId, seasonId));
	});

	return { success: true as const };
});
