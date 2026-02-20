import { type Handle, type HandleServerError, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { AppError } from '$lib/errors';

export const handleError: HandleServerError = ({ error, event, status }) => {
	// Build request context for structured logging
	const requestContext = {
		url: event.url.pathname,
		method: event.request.method,
		status,
		userAgent: event.request.headers.get('user-agent'),
		ip: event.getClientAddress()
	};

	// Handle expected application errors (AppError)
	if (error instanceof AppError) {
		logger.error('AppError caught in handleError', {
			...requestContext,
			...error.toJSON()
		});

		return {
			message: error.message
		};
	}

	// Handle unexpected JavaScript errors
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

	// Handle unknown error types (e.g., thrown primitives)
	logger.error('Unknown error type caught in handleError', {
		...requestContext,
		error: typeof error === 'object' ? JSON.stringify(error) : String(error)
	});

	return {
		message: 'An unexpected error occurred'
	};
};

/**
 * Authentication handler - checks user permissions for admin routes
 */
export const authHandle: Handle = async ({ event, resolve }) => {
	const user = (await auth.api.getSession(event.request))?.user;

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

export const handle: Handle = sequence(requestLogHandle, authHandle);
