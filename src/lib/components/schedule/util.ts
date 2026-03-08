import {
	eachDayOfInterval,
	endOfISOWeek,
	setISOWeek,
	setISOWeekYear,
	startOfISOWeek
} from 'date-fns';

/**
 * Get an array of Date objects representing the weekdays of a given ISO week and year.
 *
 * @param year - The ISO week-numbering year (e.g., 2024)
 * @param week - The ISO week number (1-53)
 *
 * @returns An array of Date objects for each weekday (Monday to Sunday) of the specified week and year.;
 */
export function getWeekdays(year: number, week: number): Date[] {
	let _week = new Date();
	_week = setISOWeekYear(_week, year);
	_week = setISOWeek(_week, week);

	const weekdays = eachDayOfInterval({
		start: startOfISOWeek(_week),
		end: endOfISOWeek(_week)
	});

	return weekdays;
}
