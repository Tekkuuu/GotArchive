import type { PageServerLoad } from './$types';
import { useWatchingWeek } from '$lib/hooks';
import { getScheduleByWeek } from '$lib/server/schedule/queries';
import { formatWeekDateLabels, formatWeekDates } from '$lib/util/dateUtils';
import { format, getISOWeek } from 'date-fns';
import { logger } from '$lib/server/logger';
import type { ScheduleEntryData } from '$lib/api/schedule/datecode';

export const load: PageServerLoad = async () => {
	let watching: Awaited<ReturnType<typeof useWatchingWeek>> = [];
	let weekDates = '';
	let weekStartLabel = '';
	let weekEndLabel = '';
	let upcoming: ScheduleEntryData[] = [];
	const errors: string[] = [];

	const now = new Date();
	const year = now.getFullYear();
	const week = getISOWeek(now);
	weekDates = formatWeekDates(year, week);
	const labels = formatWeekDateLabels(year, week);
	weekStartLabel = labels.start;
	weekEndLabel = labels.end;

	try {
		const datecode = `${year}${week < 10 ? '0' + week.toString() : week}`;
		watching = await useWatchingWeek(datecode);
	} catch (err) {
		logger.error('Failed to fetch watching week data', {
			source: 'homePage',
			error: err instanceof Error ? err.message : String(err)
		});
		errors.push('Failed to load weekly schedule');
	}

	try {
		const schedule = await getScheduleByWeek(year, week);
		const today = format(now, 'yyyy-MM-dd');
		upcoming = (schedule?.entries ?? [])
			.filter((entry) => !entry.isCancelled && entry.date >= today)
			.sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`))
			.slice(0, 3);
	} catch (err) {
		logger.error('Failed to fetch upcoming entries', {
			source: 'homePage',
			error: err instanceof Error ? err.message : String(err)
		});
		errors.push('Failed to load upcoming streams');
	}

	return { watching, weekDates, weekStartLabel, weekEndLabel, upcoming, errors };
};
