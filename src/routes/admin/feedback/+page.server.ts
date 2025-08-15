import type { Actions, PageServerLoad } from './$types';
import { services, db } from '$lib/server/db';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { deleteFormSchema, updateFormSchema } from './util';
import { fail } from '@sveltejs/kit';
import { AppError, ERROR_CODES } from '$lib/errors';
import { sentry, type SentryLoggerOptions } from '$lib/sentry';
import _ from 'lodash';
import type { Feedback } from '$lib/server/db';

export const load: PageServerLoad = async ({ request }) => {
  const deleteForm = await superValidate(zod4(deleteFormSchema));
  const updateForm = await superValidate(zod4(updateFormSchema));

  const feedbacks = await services.feedback.select(db);

  return { feedbacks, deleteForm, updateForm };
}

export const actions: Actions = {
  delete: async ({ request, url, locals }) => {
    const form = await superValidate(request, zod4(deleteFormSchema));

    if (!form.valid) {
      return fail(400, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
    }

    try {
      db.transaction(async (tx) => {
        await services.feedback.delete(tx, { feedbackId: form.data.feedbackId })
      });
    } catch (err) {
      let context: SentryLoggerOptions = {
        tags: {
          url: url.pathname,
          form: 'delete-feedback',
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
  },
  update: async ({ request, url, locals }) => {
    const form = await superValidate(request, zod4(updateFormSchema));

    if (!form.valid) {
      return fail(400, { form, text: ERROR_CODES.forms.VALIDATION_FAILED.message });
    }

    try {
      db.transaction(async (tx) => {
        await services.feedback.update(
          tx,
          { status: form.data.status as Feedback['status'] },
          { feedbackId: form.data.feedbackId }
        );
      });
    } catch (err) {
      let context: SentryLoggerOptions = {
        tags: {
          url: url.pathname,
          form: 'update-feedback-status',
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
