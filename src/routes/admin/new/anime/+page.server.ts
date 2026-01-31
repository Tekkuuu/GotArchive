import { db } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { superValidate, fail as failWithFiles } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { formSchema } from './util';
import { services } from '$lib/server/db';
import { FormError, ERROR_CODES, AppError } from '$lib/errors';
import { sentry, type SentryLoggerOptions } from '$lib/sentry';
import _ from 'lodash';

export const load: PageServerLoad = async ({ request }) => {
	const form = await superValidate(zod(formSchema));

	const anime = await services.anime.select(db);
	const platforms = await services.platform.select(db);
	const genres = await services.genre.select(db);

	return { anime, platforms, genres, form };
};

export const actions: Actions = {
	create: async ({ request, locals, url }) => {
		const form = await superValidate(request, zod(formSchema));

		if (!form.valid) {
			fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.transaction(async (tx) => {
				const animeInsertedRows = await services.anime.insert(tx, _.omit(form.data, ['links']));

				// Get genres that are not yet in the database and insert them
				const genreToInsert = _.pick(form.data, ['genres']).genres.filter((g) => g.genreId === -1);
				let genreInsertedRows: Awaited<ReturnType<typeof services.genre.insert>> = [];

				if (genreToInsert.length > 0) {
					genreInsertedRows = await services.genre.insert(tx, genreToInsert);
				}

				const animeId = animeInsertedRows.at(0)?.animeId;

				if (animeId === undefined) {
					throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, {
						form: 'new-anime'
					});
				}

				// If after inserting new genres, we still somehow can find the new genre's id after insert
				// we can default to leaving it as -1 since insertAnimeGenre schema validation will catch that
				const animeGenreData = form.data.genres.map((g) => {
					if (g.genreId !== -1) return { animeId: animeId, genreId: g.genreId };
					const newId = genreInsertedRows.find((gi) => gi.name === g.name)?.genreId;
					if (newId === undefined) return { animeId: animeId, genreId: g.genreId };
					else return { animeId: animeId, genreId: newId };
				});

				if (animeGenreData.length > 0) {
					services.animeGenre.insert(tx, animeGenreData);
				}

				const linksData = form.data.links.map((l) => ({ animeId, ...l }));

				if (linksData.length > 0) {
					await services.animeLink.insert(tx, linksData);
				}
			});
		} catch (err) {
			if (!(err instanceof FormError)) {
				let context: SentryLoggerOptions = {
					tags: {
						url: url.pathname,
						form: 'new-anime-bulk'
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
