import { form, getRequestEvent } from '$app/server';
import { invalid } from '@sveltejs/kit';
import { timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { ERROR_CODES } from '$lib/errors';
import { RegisterFormSchema } from '$lib/schemas/auth';

/** Constant-time comparison of the registration code to avoid a timing oracle. */
function codesMatch(provided: string, expected: string): boolean {
	const a = Buffer.from(provided);
	const b = Buffer.from(expected);
	if (a.length !== b.length) return false;
	return timingSafeEqual(a, b);
}

/**
 * Registers a new account.
 * @param input - Registration fields.
 * @returns Validation result.
 */
export const register = form(RegisterFormSchema, async (data, issue) => {
	const expectedCode = env.REGISTRATION_CODE;
	if (!expectedCode || !codesMatch(data.registrationCode, expectedCode)) {
		// Do not log the attempted email — registration is unauthenticated input.
		logger.warn('Registration attempt with invalid code');
		invalid(issue.registrationCode(ERROR_CODES.auth.INVALID_REGISTRATION_CODE.message));
	}

	const { request } = getRequestEvent();

	try {
		const result = await auth.api.signUpEmail({
			body: {
				name: data.name,
				email: data.email,
				password: data.password,
				role: 'user'
			},
			headers: request.headers
		});

		if (!result) {
			invalid(issue.email('Could not create account. The email may already be in use.'));
		}
	} catch (e) {
		logger.error('Sign-up failed', {
			error: e instanceof Error ? e.message : String(e)
		});
		invalid(issue.email('Could not create account. The email may already be in use.'));
	}

	return { success: true as const };
});
