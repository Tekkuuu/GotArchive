import { type Handle, type HandleServerError, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';
import { AppError } from '$lib/errors';

/**
 * Enhanced error handler with structured logging for BetterStack.
 *
 * Best practices:
 * - Log all errors with structured data for easy querying in BetterStack
 * - Include request context (URL, method, user) to aid debugging
 * - Return safe error messages to the client (no sensitive data)
 * - Distinguish between AppError (expected) and unexpected errors
 */
export const handleError: HandleServerError = ({ error, event, status, message }) => {
	const errorId = crypto.randomUUID();

	// Build request context
	const requestContext = {
		errorId,
		url: event.url.pathname,
		method: event.request.method,
		status,
		userAgent: event.request.headers.get('user-agent'),
		ip: event.getClientAddress()
	};

	// Log AppError with full context
	if (error instanceof AppError) {
		logger.error({
			msg: 'AppError caught in handleError',
			...requestContext,
			...error.toJSON()
		});

		// Return safe error to client
		return {
			message: error.message,
			errorId
		};
	}

	// Log unexpected errors
	if (error instanceof Error) {
		logger.error({
			msg: 'Unexpected error caught in handleError',
			...requestContext,
			error: {
				name: error.name,
				message: error.message,
				stack: error.stack
			}
		});

		return {
			message: dev ? error.message : 'An unexpected error occurred',
			errorId
		};
	}

	// Log unknown error types
	logger.error({
		msg: 'Unknown error type caught in handleError',
		...requestContext,
		error
	});

	return {
		message: 'An unexpected error occurred',
		errorId
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
		logger.warn({
			msg: 'Unauthorized access attempt',
			url: event.url.pathname,
			userId: user?.id,
			userRole: user?.role
		});

		throw redirect(303, '/unauthorized');
	}

	return await resolve(event);
};

/**
 * Request logging handler - logs all requests with timing
 */
export const requestLogHandle: Handle = async ({ event, resolve }) => {
	const startTime = Date.now();

	// Log incoming request
	logger.info({
		msg: 'Request started',
		method: event.request.method,
		url: event.url.pathname,
		search: event.url.search
	});

	const response = await resolve(event);

	// Log completed request with duration
	const duration = Date.now() - startTime;
	logger.info({
		msg: 'Request completed',
		method: event.request.method,
		url: event.url.pathname,
		status: response.status,
		duration
	});

	return response;
};

// Compose all handles in sequence
export const handle: Handle = sequence(
	requestLogHandle, // Log requests first
	authHandle // Then check auth
);
