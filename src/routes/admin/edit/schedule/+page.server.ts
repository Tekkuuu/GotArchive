import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { db, schema, eq } from '$lib/server/db';
import { AppError } from '$lib/errors';
import { superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { deleteFormSchema, previewFormSchema } from './util';
import _ from 'lodash';

export const load: PageServerLoad = async () => {
	const schedules = await db.select().from(schema.schedule);

	const deleteForm = await superValidate(zod(deleteFormSchema));
	const previewForm = await superValidate(zod(previewFormSchema));

	return {
		schedule: schedules,
		deleteForm,
		previewForm
	};
};

export const actions: Actions = {
	preview: async ({ request, locals, url }) => {
		const form = await superValidate(request, zod(previewFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db.transaction(async (tx) => {
				await tx
					.update(schema.schedule)
					.set({ preview: form.data.preview })
					.where(eq(schema.schedule.scheduleId, form.data.scheduleId));
			});
		} catch (err) {
			if (err instanceof AppError) {
				return fail(err.httpStatus, { form, text: err.message });
			} else if (err instanceof Error) {
				return fail(500, { form, text: err.message });
			} else {
				return fail(500, { form, text: 'Unexpected error occurred' });
			}
		}
	},
	delete: async ({ request, locals, url }) => {
		const form = await superValidate(request, zod(deleteFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		try {
			await db.transaction(async (tx) => {
				await tx
					.delete(schema.schedule)
					.where(eq(schema.schedule.scheduleId, form.data.scheduleId));
			});

			return { form };
		} catch (err) {
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
