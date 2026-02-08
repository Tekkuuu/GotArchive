import { Redis } from '@upstash/redis';
import { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } from '$env/static/private';
import { addDays } from 'date-fns';
import * as z from 'zod';

export const redis = new Redis({
	url: UPSTASH_REDIS_REST_URL,
	token: UPSTASH_REDIS_REST_TOKEN
});

/**
 * Limits to `limit` requests per `windowSeconds`.
 * Returns true if under limit, false if blocked.
 *
 * @param key Unique identifier (userId, IP, or anonId)
 * @param limit Max allowed requests per window
 * @param windowSeconds Time window in seconds
 */
export async function rateLimit(
	key: string,
	limit: number,
	windowSeconds: number
): Promise<boolean> {
	const count = await redis.incr(key);

	if (count === 1) {
		await redis.expire(key, windowSeconds);
	}

	return count <= limit;
}

/**
 * Adds the given user UUID to today's Daily Active Users (DAU) set in Redis.
 * The set is keyed by the current date (YYYY-MM-DD) and will expire after 7 days.
 *
 * @param uuid - The unique identifier of the user to record as active today.
 */
export async function updateDAU(uuid: string) {
	const today = new Date().toISOString().slice(0, 10);
	await redis.sadd(`dau:${today}`, uuid);
	await redis.expire(`dau:${today}`, 24 * 60 * 60 * 7); // 1 day expiration
}

export async function getDAU(date: string): Promise<number | null> {
	const validDate = z.iso.date().safeParse(date);
	if (!validDate.success) {
		return null;
	}

	try {
		const dau = await redis.scard(`dau:${validDate.data}`);
		return dau;
	} catch (err) {
		return null;
	}
}
