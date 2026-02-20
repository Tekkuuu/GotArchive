import { json, type RequestHandler } from '@sveltejs/kit';
import * as z from 'zod';
import { rateLimit } from '$lib/server/redis';
import { logger } from '$lib/server/logger';

/**
 * Maximum accepted request body size in bytes (4 KB).
 * Rejects oversized payloads before Zod even sees them.
 */
const MAX_BODY_BYTES = 4 * 1024;

/**
 * Rate limit: 10 log submissions per IP per 60 seconds.
 * Generous enough for real browser errors; restrictive enough to prevent flooding.
 */
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW = 60;

/**
 * Accepted payload shape. Only 'error' and 'fatal' are forwarded to the log
 * pipeline — the client logger already filters lower levels out before sending.
 */
const ClientLogSchema = z.object({
	level: z.enum(['error', 'fatal']),
	message: z.string().min(1).max(500),
	timestamp: z.iso.datetime(),
	url: z.string().max(2000),
	userAgent: z.string().max(500),
	// Optional structured context — anything the client chose to attach.
	// Capped at 10 keys, each value coerced to string to prevent deep nesting.
	context: z.record(z.string(), z.unknown()).optional()
});

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	// --- Body size guard ---
	const contentLength = request.headers.get('content-length');
	if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
		return new Response(null, { status: 413 });
	}

	// --- Rate limit by client IP ---
	const ip = getClientAddress();
	const allowed = await rateLimit(`rl:client-logs:${ip}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW);
	if (!allowed) {
		return new Response(null, { status: 429 });
	}

	// --- Parse and validate body ---
	let raw: unknown;
	try {
		raw = await request.json();
	} catch {
		return new Response(null, { status: 400 });
	}

	const parsed = ClientLogSchema.safeParse(raw);
	if (!parsed.success) {
		return new Response(null, { status: 400 });
	}

	const { level, message, timestamp, url, userAgent, context } = parsed.data;

	// --- Forward to server logger (Winston → BetterStack/Logwell) ---
	// Winston uses npm levels: error, warn, info, … — no native 'fatal'.
	// Map 'fatal' to 'error' and include a flag so it's filterable in BetterStack.
	const winstonLevel = level === 'fatal' ? 'error' : level;
	logger[winstonLevel](`[client] ${message}`, {
		source: 'client',
		fatal: level === 'fatal',
		clientTimestamp: timestamp,
		clientUrl: url,
		userAgent,
		ip,
		...context
	});

	return new Response(null, { status: 204 });
};
