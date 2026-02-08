import { db, schema } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { formSchema } from './util';
import { FormError, ERROR_CODES, AppError } from '$lib/errors';
import { sentry, type SentryLoggerOptions } from '$lib/sentry';
import _ from 'lodash';

export const load: PageServerLoad = async ({}) => {
	const form = await superValidate(zod4(formSchema));

	const anime = await db.select().from(schema.anime);
	const platforms = await db.select().from(schema.platform);
	const genres = await db.select().from(schema.genre).orderBy(schema.genre.name);

	return { anime, platforms, genres, form };
};

export const actions: Actions = {
	create: async ({ request, url }) => {
		const form = await superValidate(request, zod4(formSchema));

		if (!form.valid) {
			fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.transaction(async (tx) => {
				const animeId = (
					await tx
						.insert(schema.anime)
						.values(_.omit(form.data, ['links']))
						.returning()
				).at(0)?.animeId;

				// Get genres that are not yet in the database and insert them
				const genresInDB = await tx.select().from(schema.genre);
				const genreToInsert = _.pick(form.data, ['genres']).genres.filter(
					(g) => !genresInDB.map((gDB) => gDB.genreId).includes(g.genreId)
				);

				let genreInsertedRows =
					genreToInsert.length > 0
						? await tx.insert(schema.genre).values(genreToInsert).returning()
						: [];

				if (genreInsertedRows.length !== genreToInsert.length) {
					// TODO: Change to proper logging later for Better Stack
					throw new Error('Inserted genres do not match wanted genres');
				}

				if (!animeId) {
					// TODO: Change to proper logging later for Better Stack
					throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, {
						form: 'new-anime'
					});
				}

				const animeGenreData = form.data.genres.map((g) => ({
					genreId: g.genreId,
					animeId: animeId
				}));

				if (animeGenreData.length > 0) {
					await tx.insert(schema.animeGenre).values(animeGenreData);
				}

				const linksData = form.data.links.map((l) => ({ animeId, ...l }));

				if (linksData.length > 0) {
					await tx.insert(schema.animeLink).values(linksData);
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
