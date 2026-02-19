import type { PageServerLoad, Actions } from './$types';
import { db, schema } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { EditSeasonFormSchema } from '$lib/schemas';
import { ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';

export const load: PageServerLoad = async ({ params }) => {
	const seasonId = params.seasonId;

	const season = await db
		.select()
		.from(schema.animeSeason)
		.where(eq(schema.animeSeason.animeSeasonId, seasonId))
		.limit(1);

	if (season.length === 0) {
		throw error(404, 'Season not found');
	}

	const anime = await db
		.select()
		.from(schema.anime)
		.where(eq(schema.anime.animeId, season[0].animeId))
		.limit(1);

	const metadata = await db
		.select()
		.from(schema.animeSeasonMetadata)
		.where(eq(schema.animeSeasonMetadata.animeSeasonId, seasonId))
		.limit(1);

	const formats = schema.typeFormat.enumValues;
	const seasonValues = schema.typeSeason.enumValues;

	const editSeasonForm = await superValidate(
		{
			animeSeasonId: season[0].animeSeasonId,
			sequence: season[0].sequence,
			format: season[0].format,
			titleNative: season[0].titleNative,
			titleRomaji: season[0].titleRomaji,
			titleEnglish: season[0].titleEnglish,
			shortTitle: season[0].shortTitle,
			season: season[0].season,
			year: season[0].year,
			episodes: season[0].episodes,
			anilistId: metadata[0]?.anilistId ?? null,
			malId: metadata[0]?.malId ?? null,
			note: metadata[0]?.note ?? null
		},
		zod4(EditSeasonFormSchema)
	);

	return {
		season: season[0],
		anime: anime[0],
		metadata: metadata[0] || null,
		formats,
		seasonValues,
		editSeasonForm
	};
};

export const actions: Actions = {
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
			logger.error({ msg: 'Error in updateSeason', error: err });
			return fail(500, { form, text: 'Failed to update season' });
		}
	}
};
