import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db, services } from '$lib/server/db';
import { AppError } from '$lib/errors';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { formSchema } from './util';
import { type SentryLoggerOptions, sentry } from '$lib/sentry';
import _ from 'lodash';

export const load: PageServerLoad = async () => {
  const response = await services.schedule.select(db);

  const form = await superValidate(zod(formSchema));

  return {
    schedule: response,
    form
  }
}

export const actions: Actions = {
  delete: async ({ request, locals, url }) => {
    const form = await superValidate(request, zod(formSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      await db.transaction(async (tx) => {
        await services.schedule.delete(tx, { scheduleId: form.data.scheduleId });
      });

      return { form };
    } catch (err) {
      let context: SentryLoggerOptions = {
        tags: {
          url: url.pathname,
          form: 'delete-schedule',
        }
      }
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

