import { json, error, type RequestHandler } from '@sveltejs/kit';
import { generateEntries } from '$lib/server/generateScheduleEntries';
import type { APIGenerateEntriesResponse } from '$lib/api/schedule/generate';
import { auth } from '$lib/server/auth';

export const GET: RequestHandler = async ({ request, url }) => {
	const user = (await auth.api.getSession(request))?.user;
	if (!user || !['admin', 'moderator'].includes(user.role)) {
		throw error(403, 'Forbidden');
	}

	const yearParam = url.searchParams.get('year');
	const weekParam = url.searchParams.get('week');

	const year = yearParam != null ? parseInt(yearParam, 10) : NaN;
	const week = weekParam != null ? parseInt(weekParam, 10) : NaN;

	if (isNaN(year) || isNaN(week) || year < 1900 || year > 2100 || week < 1 || week > 53) {
		throw error(400, 'Invalid year or week parameter');
	}

	const { entries, slotsToReset } = await generateEntries(year, week);

	return json({ entries, slotsToReset } satisfies APIGenerateEntriesResponse);
};
