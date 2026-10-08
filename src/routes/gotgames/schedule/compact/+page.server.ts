import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getScheduleByWeek, parseDatecode } from '$lib/server/schedule/queries';
import { getISOWeek, getISOWeekYear } from 'date-fns';
import { isoWeekDateRange } from '$lib/api/schedule/timezone';
import { logger } from '$lib/server/logger';

export const load: PageServerLoad = async ({ url }) => {
	const datecodeParam = url.searchParams.get('datecode');

	let year: number;
	let week: number;
	let datecode: string;

	if (datecodeParam) {
		const parsed = parseDatecode(datecodeParam);
		if (!parsed) {
			throw error(400, { message: `Invalid datecode "${datecodeParam}". Expected YYYYWW format.` });
		}
		year = parsed.year;
		week = parsed.week;
		datecode = datecodeParam;
	} else {
		const now = new Date();
		year = getISOWeekYear(now);
		week = getISOWeek(now);
		datecode = `${year}${week.toString().padStart(2, '0')}`;
	}

	try {
		const result = await getScheduleByWeek(year, week);

		if (!result) {
			return {
				scheduleData: {
					schedule: { scheduleId: '', year, week, note: null, preview: false },
					weekRange: '',
					weekDateRange: isoWeekDateRange(year, week),
					entries: [],
					adjacentEntries: []
				},
				datecode
			};
		}

		return { scheduleData: result, datecode };
	} catch (err) {
		logger.error('Failed to load compact schedule page', {
			datecode,
			error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err)
		});
		throw error(500, { message: 'Failed to load schedule' });
	}
};
