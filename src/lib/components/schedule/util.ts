import {
	eachDayOfInterval,
	endOfISOWeek,
	setISOWeek,
	setISOWeekYear,
	startOfISOWeek
} from 'date-fns';

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
