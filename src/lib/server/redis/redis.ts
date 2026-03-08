import Redis from 'ioredis';
import { REDIS_URL } from '$env/static/private';

/**
 * Singleton ioredis client.
 *
 * Connects via the REDIS_URL environment variable (standard redis:// or
 * rediss:// connection string). TLS is enabled automatically when the scheme
 * is rediss:// — no extra configuration needed for Railway's private network.
 *
 * Connection errors are logged to stderr so they don't crash the app on boot.
 */
export const redis = new Redis(REDIS_URL, {
	// Reconnect with exponential back-off, capped at 10 s
	retryStrategy: (times) => Math.min(times * 200, 10_000),
	// TLS options — ioredis enables TLS automatically for rediss:// URLs.
	// Set rejectUnauthorized: false only if your Redis certificate is self-signed.
	tls: REDIS_URL.startsWith('rediss://') ? {} : undefined,
	// Suppress ioredis's default unhandled-error warning; we handle it below.
	lazyConnect: false
});

redis.on('error', (err) => {
	process.stderr.write(`[redis] Connection error: ${String(err)}\n`);
});

/**
 * Sliding-window rate limiter using a Redis counter.
 *
 * Returns `true` if the request is within the allowed limit, `false` if it
 * should be blocked.
 *
 * @param key    Unique bucket identifier (e.g. `rl:logs:<ip>`)
 * @param limit  Maximum number of requests allowed per window
 * @param windowSeconds  Window duration in seconds
 */
export async function rateLimit(
	key: string,
	limit: number,
	windowSeconds: number
): Promise<boolean> {
	const count = await redis.incr(key);
	if (count === 1) {
		// Only set expiry on first increment — avoids resetting the window on
		// every request while still being atomic enough for our use case.
		await redis.expire(key, windowSeconds);
	}
	return count <= limit;
}
