import { add, isValid, addDays, parseISO } from 'date-fns';

export function parseDurationString(
	str: string
): { hours: number; minutes: number; seconds: number } | null {
	if (!str) return null;
	const regex = /(\d+)([hms])/g;
	let match;
	let duration = { hours: 0, minutes: 0, seconds: 0 };
	let found = false;
	while ((match = regex.exec(str)) !== null) {
		found = true;
		if (match[2] === 'h') duration.hours += parseInt(match[1], 10);
		if (match[2] === 'm') duration.minutes += parseInt(match[1], 10);
		if (match[2] === 's') duration.seconds += parseInt(match[1], 10);
	}
	return found ? duration : null;
}

/**
 * Computes the watched-after Date.
 *
 * @param date - Required date string (YYYY-MM-DD)
 * @param time - Optional time string (HH:MM[:SS] or null/undefined/empty)
 * @param durationStr - Duration string like '1h30m'
 * @returns Date object of (date+time)+duration, or (date+1day@00:00)+duration if no time. Returns undefined if invalid input.
 */
export function computeWatchedAfterDate(
	date: string | null | undefined,
	time: string | null | undefined,
	durationStr: string | null | undefined
): Date | undefined {
	if (!date) return undefined;

	// If duration is empty/invalid, always use date + 1 day at 00:00
	const duration = parseDurationString(durationStr ?? '');
	if (!duration) {
		try {
			const base = addDays(parseISO(`${date}T00:00:00.000Z`), 1);
			return isValid(base) ? base : undefined;
		} catch {
			return undefined;
		}
	}

	// If we have a valid duration, use date+time if available, otherwise date+1day@00:00
	let base: Date;
	try {
		if (time && time.trim() !== '') {
			// Always treat as UTC!
			base = parseISO(`${date}T${time}.000Z`);
			const result = add(base, duration);
			return isValid(result) ? result : undefined;
		} else {
			base = addDays(parseISO(`${date}T00:00:00.000Z`), 1);
			return isValid(base) ? base : undefined;
		}
	} catch {
		return undefined;
	}
}

/**
 * Given the schedule entry's date and time, and the watchedAfter Date,
 * returns a duration string like '1h30m' or '72h'.
 * - If time is empty/null/undefined, uses date+1 day at 00:00.
 * - If watchedAfter is before base date+time, returns undefined.
 * - Returns '0s' for zero duration.
 *
 * @param date - Required date string (YYYY-MM-DD)
 * @param time - Optional time string (HH:MM[:SS] or null/undefined/empty)
 * @param watchedAfter - The Date (or string) to compute duration to
 */
export function computeDurationStringFromWatchedAfter(
	date: string | null | undefined,
	time: string | null | undefined,
	watchedAfter: Date | string | null | undefined
): string | undefined {
	if (!date || !watchedAfter) return undefined;

	const watchedAfterDate = typeof watchedAfter === 'string' ? parseISO(watchedAfter) : watchedAfter;
	if (!isValid(watchedAfterDate)) return undefined;

	if (!time || time.trim() === '') {
		// If no time, only valid watchedAfter is date+1day@00:00:00Z
		const [year, month, day] = date.split('-').map(Number);
		const base = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0));
		if (watchedAfterDate.getTime() === base.getTime()) {
			return '0s';
		} else {
			// If not exactly at midnight next day, treat as invalid or return undefined
			return undefined;
			// Optionally, if you want to return the offset, you could:
			// let diffMs = watchedAfterDate.getTime() - base.getTime();
			// ...and calculate as before, but that doesn't match your UX.
		}
	}

	// If time is provided, do the normal difference calculation
	let base: Date;
	try {
		const timeWithSeconds = time.length === 5 ? `${time}:00` : time;
		base = parseISO(`${date}T${timeWithSeconds}.000Z`);
	} catch {
		return undefined;
	}

	if (!isValid(base)) return undefined;

	const diffMs = watchedAfterDate.getTime() - base.getTime();
	if (diffMs < 0) return undefined;
	if (diffMs === 0) return '0s';

	let totalSeconds = Math.floor(diffMs / 1000);
	const hours = Math.floor(totalSeconds / 3600);
	totalSeconds -= hours * 3600;
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds - minutes * 60;

	let result = '';
	if (hours > 0) result += `${hours}h`;
	if (minutes > 0) result += `${minutes}m`;
	if (seconds > 0) result += `${seconds}s`;
	return result;
}
