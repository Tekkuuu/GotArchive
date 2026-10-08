import type { ScheduleEntryData, ScheduleMetadata } from '$lib/api/schedule/datecode';
import type { IsoWeekDateRange, TimezoneAdjustedEntry } from '$lib/api/schedule/datecode';

/** Weekday-grouped entries. */
export type EntriesByWeekday = Map<number, TimezoneAdjustedEntry[]>;

/** Schedule page data. */
export interface SchedulePageData {
	schedule: ScheduleMetadata | null;
	weekRange: string;
	/** Inclusive Monday–Sunday date bounds of the displayed ISO week (UTC). */
	weekDateRange: IsoWeekDateRange;
	entries: ScheduleEntryData[];
	/** Entries from the prev/next ISO weeks for cross-week timezone shifting. */
	adjacentEntries: ScheduleEntryData[];
	currentYear: number;
	currentWeek: number;
}
