import pino from 'pino';
import { dev } from '$app/environment';

// Environment variables for BetterStack
const BETTERSTACK_BACKEND_TOKEN = process.env.BETTERSTACK_BACKEND_TOKEN;
const BETTERSTACK_BACKEND_HOST = process.env.BETTERSTACK_BACKEND_HOST;
const BETTERSTACK_ENABLED = process.env.BETTERSTACK_ENABLED === 'true';

// Determine if we should enable BetterStack
const shouldUseBetterStack = () => {
	if (!BETTERSTACK_BACKEND_TOKEN || !BETTERSTACK_BACKEND_HOST) return false;
	if (dev) return BETTERSTACK_ENABLED; // In dev, only if explicitly enabled
	return true; // Always enabled in production if token exists
};

// Create transports configuration
const createTransports = () => {
	const transports: any[] = [];

	// BetterStack transport for backend (uses @logtail/pino)
	if (shouldUseBetterStack()) {
		transports.push({
			level: 'info',
			target: '@logtail/pino',
			options: {
				sourceToken: BETTERSTACK_BACKEND_TOKEN,
				endpoint: BETTERSTACK_BACKEND_HOST
			}
		});
	}

	// Pretty printing in development (always add if in dev)
	if (dev) {
		transports.push({
			level: 'debug',
			target: 'pino-pretty',
			options: {
				colorize: true,
				translateTime: 'HH:MM:ss.l',
				ignore: 'pid,hostname'
			}
		});
	}

	// If no transports configured, use default console output
	if (transports.length === 0) {
		return undefined;
	}

	return { targets: transports };
};

// Base logger configuration
const loggerOptions: pino.LoggerOptions = {
	level: dev ? 'debug' : 'info',
	base: {
		service: 'gotarchive-backend',
		env: dev ? 'development' : 'production'
	},
	formatters: {
		level: (label) => ({ level: label })
	},
	timestamp: pino.stdTimeFunctions.isoTime
};

// Create the logger with transports
const transports = createTransports();

export const logger = transports
	? pino(loggerOptions, pino.transport(transports))
	: pino(loggerOptions);

// Utility function to create child loggers with context
export function createLogger(context: Record<string, unknown>) {
	return logger.child(context);
}

// Export types for use in other files
export type Logger = typeof logger;
