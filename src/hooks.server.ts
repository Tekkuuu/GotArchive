import { type Handle, type HandleServerError, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { AppError } from '$lib/errors';

export const handleError: HandleServerError = ({ error, event, status }) => {
	const requestContext = {
		url: event.url.pathname,
		method: event.request.method,
		status,
		userAgent: event.request.headers.get('user-agent'),
		ip: event.getClientAddress()
	};

	if (error instanceof AppError) {
		logger.error('AppError caught in handleError', {
			...requestContext,
			...error.toJSON()
		});

		return {
			message: error.message
		};
	}

	if (error instanceof Error) {
		logger.error('Unexpected error caught in handleError', {
			...requestContext,
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack
			}
		});

		return {
			message: dev ? error.message : 'An unexpected error occurred'
		};
	}

	logger.error('Unknown error type caught in handleError', {
		...requestContext,
		error: typeof error === 'object' ? JSON.stringify(error) : String(error)
	});

	return {
		message: 'An unexpected error occurred'
	};
};

/** Guards admin routes. */
export const authHandle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	event.locals.session = session ?? null;
	event.locals.user = session?.user ?? null;

	const user = session?.user;

	if (
		event.url.pathname.startsWith('/admin') &&
		(!user || !['admin', 'moderator'].includes(user.role))
	) {
		logger.warn('Unauthorized access attempt', {
			url: event.url.pathname,
			userId: user?.id,
			userRole: user?.role
		});

		throw redirect(303, '/unauthorized');
	}

	return await resolve(event);
};

/** Builds security headers. @returns Headers. */
function buildSecurityHeaders(): Record<string, string> {
	// The dev toolchain (Vite/SvelteKit HMR) uses eval; production must not.
	const csp = [
		"default-src 'self'",
		dev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: https:",
		"connect-src 'self' https://graphql.anilist.co",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'"
	].join('; ');

	const headers: Record<string, string> = {
		'Content-Security-Policy': csp,
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'X-DNS-Prefetch-Control': 'off'
	};

	// HSTS only makes sense over HTTPS; skip it in local dev.
	if (!dev) {
		headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
	}

	return headers;
}

export const securityHeadersHandle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event);

	for (const [name, value] of Object.entries(buildSecurityHeaders())) {
		response.headers.set(name, value);
	}

	return response;
};

export const requestLogHandle: Handle = async ({ event, resolve }) => {
	const startTime = Date.now();
	const SLOW_REQUEST_THRESHOLD_MS = 1000; // 1 second

	const response = await resolve(event);

	const duration = Date.now() - startTime;
	const isSlowRequest = duration >= SLOW_REQUEST_THRESHOLD_MS;
	const isError = response.status >= 400;

	// Only log slow requests or errors
	if (isSlowRequest || isError) {
		const logMessage =
			isSlowRequest && isError
				? 'Slow request with error'
				: isSlowRequest
					? 'Slow request detected'
					: 'Request error';

		const logMetadata = {
			method: event.request.method,
			url: event.url.pathname,
			search: event.url.search || undefined,
			status: response.status,
			duration
		};

		if (isError) {
			logger.warn(logMessage, logMetadata);
		} else {
			logger.info(logMessage, logMetadata);
		}
	}

	return response;
};

export const handle: Handle = sequence(requestLogHandle, securityHeadersHandle, authHandle);
