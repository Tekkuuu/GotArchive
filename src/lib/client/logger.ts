import { dev, browser } from '$app/environment';

// Type definitions matching server logger interface
export interface ClientLogger {
	trace: (msg: string | object, ...args: any[]) => void;
	debug: (msg: string | object, ...args: any[]) => void;
	info: (msg: string | object, ...args: any[]) => void;
	warn: (msg: string | object, ...args: any[]) => void;
	error: (msg: string | object, ...args: any[]) => void;
	fatal: (msg: string | object, ...args: any[]) => void;
}

// Environment variables for BetterStack (frontend)
const BETTERSTACK_FRONTEND_TOKEN = import.meta.env.PUBLIC_BETTERSTACK_FRONTEND_TOKEN;
const BETTERSTACK_FRONTEND_HOST = import.meta.env.PUBLIC_BETTERSTACK_FRONTEND_HOST;
const BETTERSTACK_ENABLED = import.meta.env.PUBLIC_BETTERSTACK_ENABLED === 'true';

// Determine if we should send to BetterStack
const shouldUseBetterStack = () => {
	if (!browser || !BETTERSTACK_FRONTEND_TOKEN || !BETTERSTACK_FRONTEND_HOST) return false;
	if (dev) return BETTERSTACK_ENABLED; // In dev, only if explicitly enabled
	return true; // Always enabled in production if token exists
};

// Send log to BetterStack via HTTP
async function sendToBetterStack(level: string, msg: string | object, context?: any) {
	if (!shouldUseBetterStack()) return;

	try {
		const logData = {
			dt: new Date().toISOString(),
			level,
			message: typeof msg === 'string' ? msg : JSON.stringify(msg),
			service: 'gotarchive-frontend',
			env: dev ? 'development' : 'production',
			...(typeof msg === 'object' ? msg : {}),
			...context
		};

		await fetch(BETTERSTACK_FRONTEND_HOST!, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${BETTERSTACK_FRONTEND_TOKEN}`
			},
			body: JSON.stringify(logData)
		});
	} catch (error) {
		// Silently fail - don't break the app if logging fails
		if (dev) {
			console.error('Failed to send log to BetterStack:', error);
		}
	}
}

// Create log function factory
function createLogFn(level: string, consoleMethod: keyof Console) {
	return (msg: string | object, ...args: any[]) => {
		// Always log to console in development
		if (dev && browser) {
			const method = console[consoleMethod] as Function;
			if (typeof msg === 'string') {
				method(`[${level.toUpperCase()}]`, msg, ...args);
			} else {
				method(`[${level.toUpperCase()}]`, msg);
			}
		}

		// Send to BetterStack if enabled
		if (browser) {
			sendToBetterStack(level, msg, args[0]);
		}
	};
}

// Client-side logger with same interface as server logger
export const logger: ClientLogger = {
	trace: createLogFn('trace', 'log'),
	debug: createLogFn('debug', 'log'),
	info: createLogFn('info', 'info'),
	warn: createLogFn('warn', 'warn'),
	error: createLogFn('error', 'error'),
	fatal: createLogFn('fatal', 'error')
};

// Utility function to create child loggers with context
export function createLogger(context: Record<string, unknown>): ClientLogger {
	return {
		trace: (msg, ...args) =>
			logger.trace(typeof msg === 'object' ? { ...msg, ...context } : msg, ...args),
		debug: (msg, ...args) =>
			logger.debug(typeof msg === 'object' ? { ...msg, ...context } : msg, ...args),
		info: (msg, ...args) =>
			logger.info(typeof msg === 'object' ? { ...msg, ...context } : msg, ...args),
		warn: (msg, ...args) =>
			logger.warn(typeof msg === 'object' ? { ...msg, ...context } : msg, ...args),
		error: (msg, ...args) =>
			logger.error(typeof msg === 'object' ? { ...msg, ...context } : msg, ...args),
		fatal: (msg, ...args) =>
			logger.fatal(typeof msg === 'object' ? { ...msg, ...context } : msg, ...args)
	};
}

export type Logger = ClientLogger;
