/**
 * Schedule timezone utilities
 *
 * Shared by all schedule views that need to convert UTC entry times to a
 * viewer-local timezone supplied via the `tz` URL parameter.
 *
 * Supported `tz` formats:
 *   - Named abbreviations: BST, GMT, UTC, EST, PST, JST, …
 *   - UTC offset notation: UTC+1, UTC-5, UTC+5:30  (case-insensitive)
 *
 * Default timezone: GMT (UTC+0)
 */

import type { ScheduleEntryData } from './datecode/types';

// ---------------------------------------------------------------------------
// Offset table
// ---------------------------------------------------------------------------

/** Named timezone abbreviations → UTC offset in minutes */
export const NAMED_TZ_OFFSETS: Readonly<Record<string, number>> = {
	UTC: 0,
	GMT: 0,
	WET: 0,
	BST: 60,
	IST: 60, // Irish Summer Time
	CET: 60,
	CEST: 120,
	EET: 120,
	EEST: 180,
	MSK: 180,
	EST: -300,
	EDT: -240,
	CST: -360,
	CDT: -300,
	MST: -420,
	MDT: -360,
	PST: -480,
	PDT: -420,
	AEST: 600,
	AEDT: 660,
	JST: 540,
	KST: 540,
	HKT: 480,
	SGT: 480,
	NZST: 720,
	NZDT: 780
};

/** The default offset applied when no `tz` param is present (GMT = UTC+0) */
export const DEFAULT_TZ_LABEL = 'GMT';
export const DEFAULT_TZ_OFFSET_MINUTES: number = NAMED_TZ_OFFSETS[DEFAULT_TZ_LABEL];

// ---------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------

/**
 * Parse a `tz` URL parameter string into a UTC offset in minutes.
 *
 * - If `raw` is `null` or empty, returns the **GMT default** (0 minutes).
 * - If the value is unrecognised, returns `null`.
 *
 * @example
 * parseTzParam(null)       // 0   (GMT default)
 * parseTzParam('GMT')      // 0
 * parseTzParam('BST')      // 60
 * parseTzParam('UTC+5:30') // 330
 * parseTzParam('PST')      // -480
 * parseTzParam('XYZ')      // null
 */
export function parseTzParam(raw: string | null): number | null {
	if (!raw) return DEFAULT_TZ_OFFSET_MINUTES;

	const upper = raw.trim().toUpperCase();

	// UTC±H  or  UTC±H:MM
	const utcMatch = upper.match(/^UTC([+-])(\d{1,2})(?::(\d{2}))?$/);
	if (utcMatch) {
		const sign = utcMatch[1] === '+' ? 1 : -1;
		const hours = parseInt(utcMatch[2], 10);
		const mins = utcMatch[3] ? parseInt(utcMatch[3], 10) : 0;
		return sign * (hours * 60 + mins);
	}

	// Named abbreviation
	if (Object.prototype.hasOwnProperty.call(NAMED_TZ_OFFSETS, upper)) {
		return NAMED_TZ_OFFSETS[upper];
	}

	return null;
}

/**
 * Derive the display label for the active timezone.
 *
 * - No param → `"GMT"` (default)
 * - Valid param → uppercased raw value
 * - Unrecognised param → `null`
 */
export function tzLabel(raw: string | null): string | null {
	if (!raw) return DEFAULT_TZ_LABEL;
	const offset = parseTzParam(raw);
	if (offset === null) return null;
	return raw.trim().toUpperCase();
}

// ---------------------------------------------------------------------------
// Week date range
// ---------------------------------------------------------------------------

/** Inclusive Monday–Sunday date range for an ISO week, as `YYYY-MM-DD` strings. */
export interface IsoWeekDateRange {
	/** Monday of the week, e.g. `"2025-03-03"` */
	start: string;
	/** Sunday of the week, e.g. `"2025-03-09"` */
	end: string;
}

/**
 * Compute the Monday (`start`) and Sunday (`end`) dates of a given ISO week
 * as `YYYY-MM-DD` strings.
 *
 * Uses the ISO 8601 algorithm: week 1 is the week containing the first Thursday.
 * Works in UTC to avoid local-timezone interference.
 */
export function isoWeekDateRange(year: number, week: number): IsoWeekDateRange {
	// Jan 4 is always in ISO week 1
	const jan4 = new Date(Date.UTC(year, 0, 4));
	// 0=Mon…6=Sun
	const jan4DowISO = (jan4.getUTCDay() + 6) % 7;
	// Monday of week 1
	const week1Monday = new Date(jan4.getTime() - jan4DowISO * 86_400_000);
	// Monday of requested week
	const weekMonday = new Date(week1Monday.getTime() + (week - 1) * 7 * 86_400_000);
	// Sunday of requested week
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

/**
 * Return a copy of `entry` with `time`, `date`, and `dayOfWeek` shifted to
 * the given UTC offset.
 *
 * - Entries **without** a time are returned unchanged (`adjustedTime: null`),
 *   because without a time there is no UTC instant to shift.
 * - The `date` and `dayOfWeek` fields are updated when the shift crosses
 *   midnight, so the entry moves to the correct weekday column.
 */
export function applyTimezone(
	entry: ScheduleEntryData,
	offsetMinutes: number
): TimezoneAdjustedEntry {
	if (!entry.time) {
		return { ...entry, adjustedTime: null };
	}

	const [hStr, mStr, sStr] = entry.time.split(':');
	const h = parseInt(hStr, 10);
	const m = parseInt(mStr, 10);
	const s = sStr ? parseInt(sStr, 10) : 0;

	const [yyyy, mm, dd] = entry.date.split('-').map(Number);

	// Treat date+time as a UTC instant
	const utc = new Date(Date.UTC(yyyy, mm - 1, dd, h, m, s));

	// Apply the target offset
	const local = new Date(utc.getTime() + offsetMinutes * 60 * 1000);

	const newH = local.getUTCHours();
	const newM = local.getUTCMinutes();
	const newS = local.getUTCSeconds();

	const newYear = local.getUTCFullYear();
	const newMonth = local.getUTCMonth() + 1;
	const newDay = local.getUTCDate();
	const newDate = `${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}`;

	// JS getUTCDay(): 0=Sunday … 6=Saturday  →  ISO: 0=Monday … 6=Sunday
	const jsDow = local.getUTCDay();
	const isoDow = jsDow === 0 ? 6 : jsDow - 1;

	const adjustedTime = `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:${String(newS).padStart(2, '0')}`;

	return {
		...entry,
		date: newDate,
		dayOfWeek: isoDow,
		time: adjustedTime,
		adjustedTime
	};
}

/**
 * Apply a timezone offset to a combined pool of entries (current week +
 * adjacent weeks), group by `dayOfWeek`, and **keep only entries whose
 * adjusted date falls within `weekDateRange`**.
 *
 * This correctly handles:
 * - Late-Sunday UTC entries that shift into Monday of the next week → excluded.
 * - Early-Monday UTC entries from adjacent weeks that shift into this week → included.
 *
 * Entries **without** a time are never shifted, so they are only included if
 * their original date already falls within the range.
 *
 * @param entries       All entries to consider (current + prev/next week combined)
 * @param offsetMinutes UTC offset in minutes (use `parseTzParam` to obtain)
 * @param weekDateRange Monday (`start`) and Sunday (`end`) of the target week
 * @param allWeekdays   Optional fixed set of weekday keys to pre-populate
 *                      (ensures every day column is present even when empty)
 */
export function groupEntriesByWeekday(
	entries: ScheduleEntryData[],
	offsetMinutes: number,
	weekDateRange: IsoWeekDateRange,
	allWeekdays?: readonly number[]
): Map<number, TimezoneAdjustedEntry[]> {
	const groups = new Map<number, TimezoneAdjustedEntry[]>((allWeekdays ?? []).map((d) => [d, []]));

	for (const raw of entries) {
		const entry = applyTimezone(raw, offsetMinutes);

		// Only keep entries that fall within the target ISO week after tz conversion
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
