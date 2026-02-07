import { ERROR_CODES, FormError, AppError } from '$lib/errors';
import { sentry, type SentryLoggerOptions } from '$lib/sentry';
import { db, schema } from '$lib/server/db';
import { fail } from '@sveltejs/kit';
import _ from 'lodash';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import type { Actions, PageServerLoad } from './$types';
import { formSchema } from './util';

export const load: PageServerLoad = async ({}) => {
	const form = await superValidate(zod4(formSchema));

	const anime = await db.select().from(schema.anime);
	const seasons = schema.typeSeason.enumValues;
	const formats = schema.typeFormat.enumValues;

	return { anime, seasons, formats, form };
};

export const actions: Actions = {
	create: async ({ request, url }) => {
		const form = await superValidate(request, zod4(formSchema));

		if (!form.valid) {
			return fail(422, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.transaction(async (tx) => {
				// Insert anime_season
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
					throw new FormError(ERROR_CODES.forms.REFERENCED_RESOURCE_NOT_FOUND, {
						form: 'new-season'
					});
				}

				// Insert anime_season_metadata
				const metadataData = {
					animeSeasonId,
					anilistId: form.data.anilistId,
					malId: form.data.malId,
					note: form.data.note
				};

				await tx.insert(schema.animeSeasonMetadata).values(metadataData);
			});
		} catch (err) {
			if (!(err instanceof FormError)) {
				let context: SentryLoggerOptions = {
					tags: {
						url: url.pathname,
						form: 'new-season'
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
