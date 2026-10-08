import type { ScheduleEntryData } from './datecode/types';

/** IANA zone used when no `tz` param is present. */
export const DEFAULT_TIME_ZONE = 'UTC';

/** Cache of validated formatters per zone (avoids rebuilding per entry). */
const formatterCache = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat | null {
	const cached = formatterCache.get(timeZone);
	if (cached) return cached;
	try {
		const fmt = new Intl.DateTimeFormat(undefined, {
			timeZone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
			numberingSystem: 'latn'
		});
		formatterCache.set(timeZone, fmt);
		return fmt;
	} catch {
		return null;
	}
}

/**
 * Parses the `tz` param as an IANA zone (e.g. `Europe/London`).
 * @param raw - tz value.
 * @returns Canonical zone, the default when absent, or null when invalid.
 */
export function parseTzParam(raw: string | null): string | null {
	if (!raw) return DEFAULT_TIME_ZONE;
	const tz = raw.trim();
	if (!tz) return DEFAULT_TIME_ZONE;
	// Only IANA zones are accepted (`Region/City`, plus `UTC`). This rejects
	// ambiguous abbreviations like `BST`/`IST` — even though Intl maps some of
	// them (e.g. BST -> Asia/Dhaka), they don't mean what viewers expect.
	if (tz !== 'UTC' && !tz.includes('/')) return null;
	try {
		const canonical = new Intl.DateTimeFormat(undefined, { timeZone: tz }).resolvedOptions()
			.timeZone;
		return canonical ?? tz;
	} catch {
		return null;
	}
}

/**
 * Labels the active timezone for display.
 * @param raw - tz value.
 * @returns Canonical label, the default when absent, or null when invalid.
 */
export function tzLabel(raw: string | null): string | null {
	if (!raw) return DEFAULT_TIME_ZONE;
	return parseTzParam(raw);
}

/** Display abbreviations per zone: [standard, daylight]. Single entry = no DST. */
const ZONE_ABBREVIATIONS: Readonly<Record<string, readonly [string] | readonly [string, string]>> =
	{
		UTC: ['UTC'],
		'Europe/Warsaw': ['CET', 'CEST'],
		'Europe/London': ['GMT', 'BST'],
		'Europe/Berlin': ['CET', 'CEST'],
		'Europe/Helsinki': ['EET', 'EEST'],
		'Europe/Moscow': ['MSK'],
		'America/New_York': ['EST', 'EDT'],
		'America/Chicago': ['CST', 'CDT'],
		'America/Denver': ['MST', 'MDT'],
		'America/Los_Angeles': ['PST', 'PDT'],
		'America/Sao_Paulo': ['BRT'],
		'Asia/Dubai': ['GST'],
		'Asia/Tokyo': ['JST'],
		'Asia/Seoul': ['KST'],
		'Asia/Singapore': ['SGT'],
		'Australia/Sydney': ['AEST', 'AEDT'],
		'Pacific/Auckland': ['NZST', 'NZDT']
	};

/** UTC offset of `timeZone` at `date`, in minutes. */
function offsetMinutesAt(timeZone: string, date: Date): number | null {
	const fmt = formatterFor(timeZone);
	if (!fmt) return null;
	const parts = fmt.formatToParts(date);
	const get = (type: string): string | undefined => parts.find((p) => p.type === type)?.value;
	const y = Number(get('year'));
	const mo = Number(get('month'));
	const d = Number(get('day'));
	let h = Number(get('hour'));
	const mi = Number(get('minute'));
	const s = Number(get('second'));
	if ([y, mo, d, h, mi, s].some((n) => Number.isNaN(n))) return null;
	if (h === 24) h = 0;
	const asUTC = Date.UTC(y, mo - 1, d, h, mi, s);
	return Math.round((asUTC - date.getTime()) / 60_000);
}

/**
 * Short (abbreviated) name for a zone at a reference instant, e.g. `BST` for
 * `Europe/London` in summer or `GMT` in winter. DST-aware.
 *
 * Uses a curated table because `Intl` short names are locale-dependent and
 * inconsistent (en-GB gives `GMT-4` for New York, en-US gives `GMT+1` for
 * London). Unknown zones fall back to the `Intl` short name.
 * @param timeZone - IANA zone.
 * @param at - Reference instant (defaults to now).
 * @returns Abbreviation or null when unknown.
 */
export function tzAbbreviation(timeZone: string, at: Date = new Date()): string | null {
	const names = ZONE_ABBREVIATIONS[timeZone];
	if (names) {
		if (names.length === 1) return names[0];
		const year = at.getUTCFullYear();
		const jan = offsetMinutesAt(timeZone, new Date(Date.UTC(year, 0, 1, 12)));
		const jul = offsetMinutesAt(timeZone, new Date(Date.UTC(year, 6, 1, 12)));
		const now = offsetMinutesAt(timeZone, at);
		if (jan === null || jul === null || now === null) return names[0];
		// DST always shifts forward, so the standard offset is the smaller one.
		return now !== Math.min(jan, jul) ? names[1] : names[0];
	}
	try {
		const parts = new Intl.DateTimeFormat(undefined, {
			timeZone,
			timeZoneName: 'short'
		}).formatToParts(at);
		return parts.find((p) => p.type === 'timeZoneName')?.value ?? null;
	} catch {
		return null;
	}
}

/** Curated zones for the display-timezone picker. */
export const TIME_ZONE_OPTIONS: readonly string[] = [
	'UTC',
	'Europe/Warsaw',
	'Europe/London',
	'Europe/Berlin',
	'Europe/Helsinki',
	'Europe/Moscow',
	'America/New_York',
	'America/Chicago',
	'America/Denver',
	'America/Los_Angeles',
	'America/Sao_Paulo',
	'Asia/Dubai',
	'Asia/Tokyo',
	'Asia/Seoul',
	'Asia/Singapore',
	'Australia/Sydney',
	'Pacific/Auckland'
];

/**
 * Detects the viewer's IANA zone. Safe to call on the server (returns null).
 * @returns Zone or null when unavailable/invalid.
 */
export function browserTimeZone(): string | null {
	try {
		const tz = new Intl.DateTimeFormat().resolvedOptions().timeZone;
		if (!tz) return null;
		if (tz !== 'UTC' && !tz.includes('/')) return null;
		return tz;
	} catch {
		return null;
	}
}

/**
 * Resolves the effective display zone: explicit `tz` param wins, otherwise the
 * viewer's zone, otherwise UTC.
 * @param raw - tz query value.
 * @param browserZone - Detected viewer zone (null on server).
 * @returns Zone to render times in (never null).
 */
export function resolveDisplayZone(raw: string | null, browserZone: string | null): string {
	if (raw?.trim()) {
		return parseTzParam(raw) ?? DEFAULT_TIME_ZONE;
	}
	if (browserZone) {
		return parseTzParam(browserZone) ?? DEFAULT_TIME_ZONE;
	}
	return DEFAULT_TIME_ZONE;
}

// ---------------------------------------------------------------------------
// Week date range
// ---------------------------------------------------------------------------

/** Monday-Sunday date range for an ISO week. */
export interface IsoWeekDateRange {
	/** Monday of the week, e.g. `"2025-03-03"` */
	start: string;
	/** Sunday of the week, e.g. `"2025-03-09"` */
	end: string;
}

/**
 * Computes ISO week bounds.
 * @param year - Year.
 * @param week - ISO week.
 * @returns Start/end YYYY-MM-DD.
 */
export function isoWeekDateRange(year: number, week: number): IsoWeekDateRange {
	const jan4 = new Date(Date.UTC(year, 0, 4));
	const jan4DowISO = (jan4.getUTCDay() + 6) % 7;
	const week1Monday = new Date(jan4.getTime() - jan4DowISO * 86_400_000);
	const weekMonday = new Date(week1Monday.getTime() + (week - 1) * 7 * 86_400_000);
	const weekSunday = new Date(weekMonday.getTime() + 6 * 86_400_000);

	return {
		start: weekMonday.toISOString().slice(0, 10),
		end: weekSunday.toISOString().slice(0, 10)
	};
}

// ---------------------------------------------------------------------------
// Entry transformation
// ---------------------------------------------------------------------------

/**
 * A schedule entry with an additional `adjustedTime` field that records
 * whether the `time` field was shifted (non-null) or was absent (null).
 */
export type TimezoneAdjustedEntry = ScheduleEntryData & { adjustedTime: string | null };

function partsInZone(
	utc: Date,
	timeZone: string
): { date: string; time: string; isoDow: number } | null {
	const fmt = formatterFor(timeZone);
	if (!fmt) return null;
	const parts = fmt.formatToParts(utc);
	const get = (type: string): string | undefined => parts.find((p) => p.type === type)?.value;
	const year = get('year');
	const month = get('month');
	const day = get('day');
	let hour = get('hour');
	const minute = get('minute');
	const second = get('second');
	if (!year || !month || !day || hour === undefined || !minute || !second) return null;
	// Intl can emit hour "24" for midnight with hour12:false — normalize to "00".
	if (hour === '24') hour = '00';
	const date = `${year}-${month}-${day}`;
	const time = `${hour}:${minute}:${second}`;
	const dow = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day))).getUTCDay();
	return { date, time, isoDow: dow === 0 ? 6 : dow - 1 };
}

/**
 * Shifts an entry (stored as a UTC instant) into an IANA timezone.
 * @param entry - Schedule entry.
 * @param timeZone - IANA zone, e.g. `Europe/London`.
 * @returns Adjusted entry.
 */
export function applyTimezone(entry: ScheduleEntryData, timeZone: string): TimezoneAdjustedEntry {
	if (!entry.time) {
		return { ...entry, adjustedTime: null };
	}

	const [hStr, mStr, sStr] = entry.time.split(':');
	const h = Number(hStr);
	const m = Number(mStr);
	const s = sStr ? Number(sStr) : 0;

	const [yyyy, mm, dd] = entry.date.split('-').map(Number);

	if ([h, m, s, yyyy, mm, dd].some((n) => Number.isNaN(n))) {
		return { ...entry, adjustedTime: null };
	}

	const utc = new Date(Date.UTC(yyyy, mm - 1, dd, h, m, s));

	if (Number.isNaN(utc.getTime())) {
		return { ...entry, adjustedTime: null };
	}

	const shifted = partsInZone(utc, timeZone);
	if (!shifted) {
		return { ...entry, adjustedTime: null };
	}

	return {
		...entry,
		date: shifted.date,
		dayOfWeek: shifted.isoDow,
		time: shifted.time,
		adjustedTime: shifted.time
	};
}

/**
 * Groups entries by weekday after shifting them into `timeZone`.
 * @param entries - Current + adjacent entries.
 * @param timeZone - IANA zone.
 * @param weekDateRange - Target week bounds.
 * @param allWeekdays - Pre-populated keys.
 * @returns Weekday map.
 */
export function groupEntriesByWeekday(
	entries: ScheduleEntryData[],
	timeZone: string,
	weekDateRange: IsoWeekDateRange,
	allWeekdays?: readonly number[]
): Map<number, TimezoneAdjustedEntry[]> {
	const groups = new Map<number, TimezoneAdjustedEntry[]>((allWeekdays ?? []).map((d) => [d, []]));

	for (const raw of entries) {
		const entry = applyTimezone(raw, timeZone);
		if (entry.date < weekDateRange.start || entry.date > weekDateRange.end) {
			continue;
		}

		const bucket = groups.get(entry.dayOfWeek);
		if (bucket) {
			bucket.push(entry);
		} else {
			groups.set(entry.dayOfWeek, [entry]);
		}
	}

	return groups;
}
