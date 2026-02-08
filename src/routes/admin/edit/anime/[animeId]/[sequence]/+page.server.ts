import { db, schema, services } from '$lib/server/db';
import { FormError, AppError, ERROR_CODES } from '$lib/errors';
import { error, fail } from '@sveltejs/kit';
import { eq, and } from 'drizzle-orm';
import _ from 'lodash';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import * as z from 'zod';
import type { PageServerLoad } from './$types';
import { formSchema, updateEpisodesFormSchema } from './util';
import type { Actions } from '../$types';
import { sentry, type SentryLoggerOptions } from '$lib/sentry';

export const load: PageServerLoad = async ({ params }) => {
	let animeId = Number(params.animeId);
	let sequence = Number(params.sequence);

	const validateParams = z.object({
		animeId: z.number().positive().int(),
		sequence: z.number().positive().int()
	});
	const validatedParams = validateParams.safeParse({ animeId, sequence });

	if (!validatedParams.success) {
		error(404, 'Not found');
	}

	const seasons = await services.animeSeason.select(
		db,
		eq(schema.animeSeason.animeId, validatedParams.data.animeId)
	);
	const currentSeason = seasons.find((s) => s.sequence === validatedParams.data.sequence);
	const nextSeason = seasons.find(
		(s) => s.sequence === validatedParams.data.sequence + 1
	)?.sequence;
	const prevSeason = seasons.find(
		(s) => s.sequence === validatedParams.data.sequence - 1
	)?.sequence;

	const episodes = await services.animeEpisode.select(
		db,
		and(eq(schema.animeEpisode.animeId, animeId), eq(schema.animeEpisode.sequence, sequence))
	);

	if (currentSeason === undefined) {
		error(404, 'Not found');
	}

	const form = await superValidate(
		{ ...currentSeason, anilistLink: currentSeason.anilistLink ?? '' },
		zod(formSchema)
	);
	const updateEpisodesForm = await superValidate(
		{
			episodes: episodes.map((e) => ({
				animeEpisodeId: e.animeEpisodeId,
				episodeNumber: e.episodeNumber,
				watched: e.watched
			}))
		},
		zod(updateEpisodesFormSchema)
	);

	return {
		form,
		updateEpisodesForm,
		animeId: animeId,
		next: nextSeason,
		previous: prevSeason,
		season: currentSeason,
		formats: schema.animeSeason.format.enumValues,
		seasons: schema.animeSeason.season.enumValues,
		episodes: episodes
	};
};

export const actions: Actions = {
	update: async ({ request, url, locals }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod(formSchema));

		if (!form.valid) {
			return fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.transaction(async (tx) => {
				await services.animeSeason.update(tx, form.data, {
					animeId: form.data.animeId,
					sequence: form.data.sequence
				});
			});

			return { form };
		} catch (err) {
			if (!(err instanceof FormError)) {
				let context: SentryLoggerOptions = {
					tags: {
						url: url.pathname,
						form: 'update-animeSeason'
					}
				};
				sentry.logServer(err, context);
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
	updateEpisodes: async ({ request, url, locals }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod(updateEpisodesFormSchema));

		if (!form.valid) {
			return fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.transaction(async (tx) => {
				const sorted = _.sortBy(form.data.episodes, ['episodeNumber']);

				await services.animeEpisode.update(
					tx,
					sorted.map((e) => ({
						watched: e.watched
					})),
					sorted.map((e) => ({
						animeEpisodeId: e.animeEpisodeId
					}))
				);
			});

			return { form };
		} catch (err) {
			if (!(err instanceof FormError)) {
				let context: SentryLoggerOptions = {
					tags: {
						url: url.pathname,
						form: 'update-animeSeasonEpisodes'
					}
				};
				sentry.logServer(err, context);
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
