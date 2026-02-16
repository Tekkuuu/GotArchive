import { dev, browser } from '$app/environment';

/**
 * Simplified client-side error logger
 * Only logs unhandled errors and exceptions to avoid flooding Logwell
 * In development, also logs to console
 */

// Send error to backend which forwards to Logwell
async function sendErrorToBackend(level: 'error' | 'fatal', message: string, context?: object) {
	if (!browser) return;

	try {
		await fetch('/api/logs', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				level,
				message,
				timestamp: new Date().toISOString(),
				userAgent: navigator.userAgent,
				url: window.location.href,
				...context
			})
		});
	} catch (error) {
		// Silently fail - don't break the app if logging fails
		if (dev) {
			console.error('Failed to send error log:', error);
		}
	}
}

// Setup global error handlers
if (browser) {
	// Capture unhandled errors
	window.addEventListener('error', (event) => {
		const errorInfo = {
			message: event.message,
			filename: event.filename,
			lineno: event.lineno,
			colno: event.colno,
			error: event.error
				? {
						name: event.error.name,
						message: event.error.message,
						stack: event.error.stack
					}
				: undefined
		};

		if (dev) {
			console.error('[UNHANDLED ERROR]', errorInfo);
		}

		sendErrorToBackend('error', `Unhandled error: ${event.message}`, errorInfo);
	});

	// Capture unhandled promise rejections
	window.addEventListener('unhandledrejection', (event) => {
		const rejectionInfo = {
			reason: event.reason,
			promise: event.promise,
			reasonString: String(event.reason)
		};

		if (dev) {
			console.error('[UNHANDLED REJECTION]', rejectionInfo);
		}

		sendErrorToBackend(
			'error',
			`Unhandled promise rejection: ${rejectionInfo.reasonString}`,
			rejectionInfo
		);
	});
}

/**
 * Manual error logging function for critical errors
 * Use sparingly - only for errors that need to be tracked
 */
export function logError(message: string, context?: Record<string, unknown>) {
	if (dev) {
		console.error('[ERROR]', message, context);
	}
	sendErrorToBackend('error', message, context);
}

/**
 * Fatal error logging - for critical errors that crash the app
 */
export function logFatal(message: string, context?: Record<string, unknown>) {
	if (dev) {
		console.error('[FATAL]', message, context);
	}
	sendErrorToBackend('fatal', message, context);
}

// Export a logger object for compatibility with existing code
export const logger = {
	error: logError,
	fatal: logFatal,
	// Deprecated methods - log warnings in dev
	trace: dev
		? (msg: string) => console.warn('logger.trace is deprecated on client', msg)
		: () => {},
	debug: dev
		? (msg: string) => console.warn('logger.debug is deprecated on client', msg)
		: () => {},
	info: dev ? (msg: string) => console.warn('logger.info is deprecated on client', msg) : () => {},
	warn: dev ? (msg: string) => console.warn('logger.warn is deprecated on client', msg) : () => {}
};

export type Logger = typeof logger;
