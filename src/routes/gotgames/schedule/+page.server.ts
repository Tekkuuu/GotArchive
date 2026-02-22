import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getISOWeek, getISOWeekYear } from 'date-fns';
import { getScheduleByWeek } from '$lib/server/schedule/queries';
import { formatWeekRange } from '$lib/util/dateUtils';
import { logger } from '$lib/server/logger';
import type { SchedulePageData } from './types';

export const load: PageServerLoad = async () => {
	const now = new Date();
	const currentYear = getISOWeekYear(now);
	const currentWeek = getISOWeek(now);

	try {
		const result = await getScheduleByWeek(currentYear, currentWeek);

		if (!result) {
			return {
				schedule: null,
				weekRange: formatWeekRange(currentYear, currentWeek),
				entries: [],
				currentYear,
				currentWeek
			} satisfies SchedulePageData;
		}

		return {
			...result,
			currentYear: result.schedule.year,
			currentWeek: result.schedule.week
		} satisfies SchedulePageData;
	} catch (err) {
		logger.error('Failed to load schedule page', {
			error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err)
		});
		throw error(500, { message: 'Failed to load schedule' });
	}
};
