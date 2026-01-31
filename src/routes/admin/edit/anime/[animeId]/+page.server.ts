import { db, schema, services } from '$lib/server/db';
import { AppError, FormError, ERROR_CODES } from '$lib/errors';
import { error, fail } from '@sveltejs/kit';
import { eq, and, getTableColumns, inArray } from 'drizzle-orm';
import _ from 'lodash';
import { superValidate, type SuperValidated } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import * as z from 'zod';
import type { infer as zInfer } from 'zod';
import type { PageServerLoad, Actions } from './$types';
import { formSchema, deleteFormSchema } from './util';
import { sentry, type SentryLoggerOptions } from '$lib/sentry';

export const load: PageServerLoad = async ({ params }) => {
	let animeId = params.animeId;

	const validate = z.string().uuid();
	const validation = validate.safeParse(animeId);

	if (!validation.success) {
		error(404, 'Not found');
	}

	const animeData = await services.anime.select(db, eq(schema.anime.animeId, validation.data));

	const genresAll = await services.genre.select(db);

	let linksData = await services.animeLink.select(
		db,
		eq(schema.animeLink.animeId, validation.data)
	);

	const genreData = await db
		.select({ ...getTableColumns(schema.genre) })
		.from(schema.genre)
		.innerJoin(schema.animeGenre, eq(schema.genre.genreId, schema.animeGenre.genreId))
		.where(eq(schema.animeGenre.animeId, validation.data));

	const platformsAll = await services.platform.select(db);

	const seasonsAll = await services.animeSeason.select(
		db,
		eq(schema.animeSeason.animeId, validation.data)
	);

	const data = {
		anime: animeData[0],
		genres: genreData,
		links: linksData
	};

	const form = await superValidate(zod(formSchema), { defaults: data });
	const deleteForm = await superValidate(zod(deleteFormSchema));

	return {
		form,
		deleteForm,
		anime: animeData[0],
		genres: genreData,
		links: linksData,
		allGenres: genresAll,
		allPlatforms: platformsAll,
		allSeasons: seasonsAll
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
				await services.anime.update(tx, _.omit(form.data.anime, ['animeId']), {
					animeId: form.data.anime.animeId
				});

				// Get new genres
				const genreNew = form.data.genres
					.filter((g: any) => !g.genreId) // UUIDs are strings, check if empty
					.map((g: any) => ({ name: g.name }));

				// Insert new genres
				let newGenresInserted: Awaited<ReturnType<typeof services.genre.insert>> = [];
				if (genreNew.length > 0) {
					newGenresInserted = await services.genre.insert(tx, genreNew);
				}

				// Update form genres with received ids
				form.data.genres.forEach((g: any) => {
					for (let ng of newGenresInserted) {
						if (!g.genreId && ng.name === g.name) {
							g.genreId = ng.genreId;
						}
					}
				});

				const genresCurrent = await services.animeGenre.select(
					db,
					eq(schema.animeGenre.animeId, form.data.anime.animeId)
				);
				const animeGenreRemove = _.differenceBy(genresCurrent, form.data.genres, 'genreId');
				const animeGenreAdd = _.differenceBy(form.data.genres, genresCurrent, 'genreId');

				// Remove anime-genre connections
				if (animeGenreRemove.length > 0) {
					await services.animeGenre.delete(
						tx,
						animeGenreRemove.map((g) => ({ animeId: form.data.anime.animeId, genreId: g.genreId }))
					);
				}

				// Add anime-gener connections
				if (animeGenreAdd.length > 0) {
					await services.animeGenre.insert(
						tx,
						animeGenreAdd.map((g) => ({
							animeId: form.data.anime.animeId,
							genreId: g.genreId
						}))
					);
				}

				const linksCurrent = await services.animeLink.select(
					db,
					eq(schema.animeLink.animeId, form.data.anime.animeId)
				);
				const animeLinkRemove = _.differenceBy(linksCurrent, form.data.links, 'url');
				const animeLinkAdd = _.differenceBy(form.data.links, linksCurrent, 'url').map((nl) => ({
					animeId: form.data.anime.animeId,
					...nl
				}));

				if (animeLinkRemove.length > 0) {
					await services.animeLink.delete(
						tx,
						animeLinkRemove.map((l) => ({ animeId: form.data.anime.animeId, url: l.url }))
					);
				}

				if (animeLinkAdd.length > 0) {
					await services.animeLink.insert(tx, animeLinkAdd);
				}
			});
		} catch (err) {
			if (!(err instanceof FormError)) {
				let context: SentryLoggerOptions = {
					tags: {
						url: url.pathname,
						form: 'update-animeseason'
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
	delete: async ({ request, url, locals }) => {
		const formData = await request.formData();
		const form = await superValidate(formData, zod(deleteFormSchema));

		if (!form.valid) {
			return fail(422, { form });
		}

		try {
			await db.transaction(async (tx) => {
				await services.animeSeason.delete(tx, {
					animeSeasonId: form.data.animeSeasonId
				});
			});
		} catch (err) {
			if (!(err instanceof FormError)) {
				let context: SentryLoggerOptions = {
					tags: {
						url: url.pathname,
						form: 'delete-animeseason'
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
