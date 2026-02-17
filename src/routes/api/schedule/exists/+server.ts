import { json, type RequestHandler } from '@sveltejs/kit';
import { schema, db, eq, and } from '$lib/server/db';
import {
	type APIValidateDateRequest,
	type APIValidateDateResponse,
	ValidateDateSchema
} from '$lib/api/schedule/exists';

export const POST: RequestHandler = async ({ request }) => {
	const { year, week }: APIValidateDateRequest = await request.json();

	if (!ValidateDateSchema.safeParse({ year, week }).success) {
		return json({
			exists: null,
			message: 'Invalid year or week data'
		} satisfies APIValidateDateResponse);
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
