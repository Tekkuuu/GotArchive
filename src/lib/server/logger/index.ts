import winston from 'winston';
import { Logwell } from 'logwell';
import { LogwellTransport } from './logwellTransport';
import { env } from '$env/dynamic/private';

const LOGWELL_ENDPOINT = env.VITE_LOGWELL_ENDPOINT;
const LOGWELL_TOKEN = env.VITE_LOGWELL_API_KEY;
const LOGWELL_ENABLED = LOGWELL_ENDPOINT && LOGWELL_TOKEN && env.VITE_LOGWELL_ENABLED === 'true';

/**
 * Winston logger with Logwell transport
 * Logs to console in development and sends to Logwell in production
 */

// Create transports array
const transports: winston.transport[] = [
	// Console transport for local development
	new winston.transports.Console({
		format: winston.format.combine(
			winston.format.colorize(),
			winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
			winston.format.printf(({ timestamp, level, message, ...metadata }) => {
				let msg = `[${timestamp}] [${level}] ${message}`;
				if (Object.keys(metadata).length > 0) {
					msg += ` ${JSON.stringify(metadata)}`;
				}
				return msg;
			})
		)
	})
];

// Add Logwell transport if enabled
if (LOGWELL_ENABLED) {
	const logwell = new Logwell({
		apiKey: LOGWELL_TOKEN!,
		endpoint: LOGWELL_ENDPOINT!,
		service: 'gotarchive-backend',
		batchSize: 50,
		flushInterval: 5000,
		maxQueueSize: 1000,
		maxRetries: 3,
		onError: (error) => {
			// Use process.stderr directly — logger itself may be unavailable here
			process.stderr.write(`[logger] Logwell error: ${String(error)}\n`);
		},
		onFlush: () => {
			// Intentionally silent — flush is a normal operational event
		}
	});

	transports.push(new LogwellTransport(logwell));
}

// Create Winston logger
export const logger = winston.createLogger({
	level: env.NODE_ENV === 'production' ? 'info' : 'debug',
	format: winston.format.combine(
		winston.format.errors({ stack: true }),
		winston.format.timestamp(),
		winston.format.json()
	),
	transports,
	// Exit on error is false to prevent process exit on logging errors
	exitOnError: false
});

// Handle graceful shutdown
if (LOGWELL_ENABLED) {
	const shutdownHandler = async () => {
		logger.info('Shutting down logger...');
		try {
			// Flush any remaining logs
			await Promise.all(
				logger.transports.map((transport) => {
					if (transport instanceof LogwellTransport) {
						return transport.close();
					}
					return Promise.resolve();
				})
			);
			logger.info('Logger shutdown complete');
		} catch (error) {
			process.stderr.write(`[logger] Error during logger shutdown: ${String(error)}\n`);
		}
	};

	process.on('SIGTERM', shutdownHandler);
	process.on('SIGINT', shutdownHandler);
	process.on('beforeExit', shutdownHandler);
}

export type Logger = typeof logger;
