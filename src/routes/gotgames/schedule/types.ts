import type { ScheduleEntryData, ScheduleMetadata } from '$lib/api/schedule/datecode';

/**
 * Entries grouped by weekday
 * Key: 0-6 (Monday to Sunday)
 * Value: Array of entries for that day
 */
export type EntriesByWeekday = Map<number, ScheduleEntryData[]>;

/**
 * Page load data structure - schedule can be null if week not found
 */
export interface SchedulePageData {
	schedule: ScheduleMetadata | null;
	weekRange: string;
	entries: ScheduleEntryData[];
	currentYear: number;
	currentWeek: number;
}
