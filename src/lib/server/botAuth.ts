import { timingSafeEqual, createHash } from 'node:crypto';
import { env } from '$env/dynamic/private';

/** Constant-time comparison of a secret to avoid a timing oracle. */
export function secretsMatch(provided: string | null | undefined, expected: string): boolean {
	if (!provided || !expected) return false;
	// Hash both sides so the comparison is always 32 bytes; comparing raw
	// buffers of different lengths would early-return and leak the length.
	const a = createHash('sha256').update(provided).digest();
	const b = createHash('sha256').update(expected).digest();
	return timingSafeEqual(a, b);
}

/**
 * Verifies the bot service token.
 * @param request - Incoming request.
 * @returns True when valid.
 */
export function isBotRequest(request: Request): boolean {
	const expected = env.BOT_API_TOKEN;
	if (!expected) return false;
	return secretsMatch(request.headers.get('x-bot-token'), expected);
}
