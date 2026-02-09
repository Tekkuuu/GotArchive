import type { PageServerLoad } from './$types';
import { fail, type Actions } from '@sveltejs/kit';
import { db, schema, eq } from '$lib/server/db';
import { AppError, ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './util';
import _ from 'lodash';

export const load: PageServerLoad = async () => {
	const anime = await db.select().from(schema.anime);

	const form = await superValidate(zod(formSchema));

	return {
		anime,
		form
	};
};

export const actions: Actions = {
	delete: async ({ request, locals, url }) => {
		const form = await superValidate(request, zod(formSchema));

		if (!form.valid) {
			return fail(400, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
		}

		try {
			await db.transaction(async (tx) => {
				await tx.delete(schema.anime).where(eq(schema.anime.animeId, form.data.animeId));
			});
		} catch (err) {
			if (!(err instanceof AppError)) {
				logger.error({
					msg: 'Unexpected error in delete anime',
					url: url.pathname,
					form: 'delete-anime',
					animeId: form.data.animeId,
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
	}
};
