import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { LoginFormSchema, RegisterFormSchema } from '$lib/schemas/auth';
import { auth } from '$lib/server/auth';
import { ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async () => {
	const loginForm = await superValidate(zod4(LoginFormSchema), { id: 'login' });
	const registerForm = await superValidate(zod4(RegisterFormSchema), { id: 'register' });

	return { loginForm, registerForm };
};

export const actions: Actions = {
	register: async ({ request }) => {
		const form = await superValidate(request, zod4(RegisterFormSchema), { id: 'register' });

		if (!form.valid) {
			return fail(400, { registerForm: form });
		}

		const expectedCode = env.REGISTRATION_CODE;
		if (!expectedCode || form.data.registrationCode !== expectedCode) {
			const { auth: authCodes } = ERROR_CODES;
			logger.warn('Registration attempt with invalid code', { email: form.data.email });
			form.errors.registrationCode = [authCodes.INVALID_REGISTRATION_CODE.message];
			return fail(authCodes.INVALID_REGISTRATION_CODE.httpStatus, { registerForm: form });
		}

		try {
			const result = await auth.api.signUpEmail({
				body: {
					name: form.data.name,
					email: form.data.email,
					password: form.data.password,
					role: 'moderator'
				}
			});

			if (!result) {
				form.errors.email = ['Could not create account. The email may already be in use.'];
				return fail(409, { registerForm: form });
			}
		} catch (e: unknown) {
			logger.error('Sign-up failed', {
				error: e instanceof Error ? e.message : String(e)
			});
			form.errors.email = ['Could not create account. The email may already be in use.'];
			return fail(409, { registerForm: form });
		}

		return { registerForm: form, success: true };
	}
};
