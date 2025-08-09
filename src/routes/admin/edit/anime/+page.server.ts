import type { PageServerLoad } from './$types';
import { fail, type Actions } from '@sveltejs/kit';
import { db, services } from '$lib/server/db';
import { AppError, ERROR_CODES } from '$lib/errors';
import { sentry, type SentryLoggerOptions } from '$lib/sentry';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { formSchema } from './util';
import _ from 'lodash';

export const load: PageServerLoad = async () => {
  const response = await services.anime.select(db);

  const form = await superValidate(zod4(formSchema));

  return {
    anime: response,
    form
  }
}

export const actions: Actions = {
  delete: async ({ request, locals, url }) => {
    const form = await superValidate(request, zod4(formSchema));

    if (!form.valid) {
      return fail(400, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
    }

    try {
      db.transaction(async (tx) => {
        await services.anime.delete(tx, { animeId: form.data.animeId })
      });
    } catch (err) {
      let context: SentryLoggerOptions = {
        tags: {
          url: url.pathname,
          form: 'delete-anime',
        }
      }
      const userId = locals.session?.user.id;
      if (userId) _.set(context, 'user.id', userId);
      sentry.logServer(err, context);

      if (err instanceof AppError) {
        return fail(err.httpStatus, { form, text: err.message })
      } else if (err instanceof Error) {
        return fail(500, { form, text: err.message })
      } else {
        return fail(500, { form, text: 'Unexpected error occurred' });
      }
    }
  }
}
