import { env } from '$env/dynamic/private';

/** Structured server logger. */

type Level = 'debug' | 'info' | 'warn' | 'error';

type LogMeta = Record<string, unknown>;

const LEVEL_ORDER: Level[] = ['debug', 'info', 'warn', 'error'];
const MIN_LEVEL: Level = env.NODE_ENV === 'production' ? 'info' : 'debug';

/** Turn Error values into something JSON.stringify won't flatten to `{}`. */
function replacer(_key: string, value: unknown): unknown {
	if (value instanceof Error) {
		return { name: value.name, message: value.message, stack: value.stack };
	}
	return value;
}

function emit(level: Level, first: unknown, meta?: LogMeta): void {
	if (LEVEL_ORDER.indexOf(level) < LEVEL_ORDER.indexOf(MIN_LEVEL)) return;

	const entry: LogMeta =
		typeof first === 'string' ? { message: first, ...meta } : { ...(first as LogMeta), ...meta };

	const line = `[${level.toUpperCase()}] ${JSON.stringify(entry, replacer)}`;

	if (level === 'error') console.error(line);
	else if (level === 'warn') console.warn(line);
	else if (level === 'info') console.info(line);
	else console.debug(line);
}

export const logger = {
	debug: (first: unknown, meta?: LogMeta) => emit('debug', first, meta),
	info: (first: unknown, meta?: LogMeta) => emit('info', first, meta),
	warn: (first: unknown, meta?: LogMeta) => emit('warn', first, meta),
	error: (first: unknown, meta?: LogMeta) => emit('error', first, meta)
};

export type Logger = typeof logger;
