export { SCHEDULE_ENTRY_TYPES, DAY_NAMES } from '$lib/schemas';

/**
 * Converts DB day to display day.
 * @param dbDay - DB day.
 * @returns Display day.
 */
export function dbDayToDisplayDay(dbDay: number): number {
	return dbDay === 0 ? 6 : dbDay - 1;
}

/**
 * Converts display day to DB day.
 * @param displayDay - Display day.
 * @returns DB day.
 */
export function displayDayToDbDay(displayDay: number): number {
	return displayDay === 6 ? 0 : displayDay + 1;
}
