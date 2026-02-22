import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logger } from '$lib/server/logger';
import { getScheduleByWeek, parseDatecode } from '$lib/server/schedule/queries';
import type { ScheduleApiResponse } from '$lib/api/schedule/datecode';

export const GET: RequestHandler = async ({ params }) => {
	const { datecode } = params;

	const parsed = parseDatecode(datecode);

	if (!parsed) {
		return json(
			{
				success: false,
				error: 'Invalid datecode format. Expected YYYYWW (e.g., 202608)'
			} satisfies ScheduleApiResponse,
			{ status: 400 }
		);
	}

	const { year, week } = parsed;

	try {
		const result = await getScheduleByWeek(year, week);

		if (!result) {
			return json(
				{
					success: false,
					error: `Schedule not found for ${year} Week ${week}`
				} satisfies ScheduleApiResponse,
				{ status: 404 }
			);
		}

		return json({ success: true, data: result } satisfies ScheduleApiResponse, {
			headers: { 'Cache-Control': 'public, max-age=300' }
		});
	} catch (err) {
		logger.error('Failed to fetch schedule for datecode', {
			datecode,
			error: err instanceof Error ? { message: err.message, stack: err.stack } : String(err)
		});
		return json(
			{
				success: false,
				error: 'Internal server error while fetching schedule'
			} satisfies ScheduleApiResponse,
			{ status: 500 }
		);
	}
};
