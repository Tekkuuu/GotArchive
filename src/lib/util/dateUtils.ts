import { startOfWeek, endOfWeek, format, parseISO } from 'date-fns';
import { isoWeekDateRange } from '$lib/api/schedule/timezone';

/**
 * Monday-Sunday bounds of an ISO week.
 * @param year - Year.
 * @param weekIndex - ISO week 1-53.
 * @returns Start/end dates.
 */
function weekBounds(year: number, weekIndex: number): { startDate: Date; endDate: Date } {
	const janFirst = new Date(year, 0, 1);
	const startDate = startOfWeek(janFirst, { weekStartsOn: 1 });
	startDate.setDate(startDate.getDate() + (weekIndex - 1) * 7);
	const endDate = endOfWeek(startDate, { weekStartsOn: 1 });
	return { startDate, endDate };
}

/**
 * Formats ISO week range.
 * @param year - Year.
 * @param weekIndex - ISO week 1-53.
 * @returns Range string.
 */
export function formatWeekRange(year: number, weekIndex: number): string {
	const { startDate, endDate } = weekBounds(year, weekIndex);

	const startDay = format(startDate, 'd');
	const startMonth = format(startDate, 'LLLL');
	const endDay = format(endDate, 'd');
	const endMonth = format(endDate, 'LLLL');

	if (startMonth === endMonth) {
		return `Week ${weekIndex}, ${startDay}-${endDay} ${startMonth}`;
	} else {
		return `Week ${weekIndex}, ${startDay} ${startMonth} - ${endDay} ${endMonth}`;
	}
}

/**
 * Formats ISO week dates without the week number.
 * @param year - Year.
 * @param weekIndex - ISO week 1-53.
 * @returns Date range string.
 */
export function formatWeekDates(year: number, weekIndex: number): string {
	const { startDate, endDate } = weekBounds(year, weekIndex);

	const startDay = format(startDate, 'd');
	const startMonth = format(startDate, 'LLLL');
	const endDay = format(endDate, 'd');
	const endMonth = format(endDate, 'LLLL');

	if (startMonth === endMonth) {
		return `${startDay}-${endDay} ${startMonth}`;
	} else {
		return `${startDay} ${startMonth} - ${endDay} ${endMonth}`;
	}
}

/**
 * Full date line for an ISO week, e.g. `5-11 October 2026, week 41`.
 * @param year - ISO week-numbering year.
 * @param week - ISO week 1-53.
 * @returns Date line string.
 */
export function formatIsoWeekLine(year: number, week: number): string {
	const { start, end } = isoWeekDateRange(year, week);
	const startDate = parseISO(start);
	const endDate = parseISO(end);
	const startMonth = format(startDate, 'LLLL');
	const endMonth = format(endDate, 'LLLL');
	const startYear = format(startDate, 'yyyy');
	const endYear = format(endDate, 'yyyy');

	let range: string;
	if (startMonth === endMonth) {
		range = `${format(startDate, 'd')}-${format(endDate, 'd')} ${endMonth} ${endYear}`;
	} else if (startYear === endYear) {
		range = `${format(startDate, 'd')} ${startMonth} - ${format(endDate, 'd')} ${endMonth} ${endYear}`;
	} else {
		range = `${format(startDate, 'd')} ${startMonth} ${startYear} - ${format(endDate, 'd')} ${endMonth} ${endYear}`;
	}
	return `${range}, week ${week}`;
}

/** Giant background date halves for the hero (e.g. `28 SEP` / `4 OCT`). */
export interface WeekDateLabels {
	start: string;
	end: string;
}

/**
 * Short uppercase date labels for the hero backdrop.
 * @param year - Year.
 * @param weekIndex - ISO week 1-53.
 * @returns Start/end labels.
 */
export function formatWeekDateLabels(year: number, weekIndex: number): WeekDateLabels {
	const { startDate, endDate } = weekBounds(year, weekIndex);
	return {
		start: `${format(startDate, 'dd')} ${format(startDate, 'MMM').toUpperCase()}`,
		end: `${format(endDate, 'dd')} ${format(endDate, 'MMM').toUpperCase()}`
	};
}
