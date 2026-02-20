import { json, error, type RequestHandler } from '@sveltejs/kit';
import { schema, db, eq, and } from '$lib/server/db';
import {
	type APIValidateDateRequest,
	type APIValidateDateResponse,
	ValidateDateSchema
} from '$lib/api/schedule/exists';
import { auth } from '$lib/server/auth';
import { logger } from '$lib/server/logger';

export const POST: RequestHandler = async ({ request }) => {
	const user = (await auth.api.getSession(request))?.user;
	if (!user || !['admin', 'moderator'].includes(user.role)) {
		logger.warn('Unauthorized access attempt to /api/schedule/exists', {
			userId: user?.id ?? null,
			role: user?.role ?? null
		});
		throw error(403, 'Forbidden');
	}

	const { year, week }: APIValidateDateRequest = await request.json();

	if (!ValidateDateSchema.safeParse({ year, week }).success) {
		return json(
			{
				exists: null,
				message: 'Invalid year or week data'
			} satisfies APIValidateDateResponse,
			{ status: 400 }
		);
	}

	const entry = await db
		.select()
		.from(schema.schedule)
		.where(and(eq(schema.schedule.year, year), eq(schema.schedule.week, week)));

	if (entry.length > 0) {
		return json({ exists: true } satisfies APIValidateDateResponse);
	} else {
		return json({ exists: false } satisfies APIValidateDateResponse);
	}
};
