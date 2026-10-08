import type { PageServerLoad } from './$types';
import { schema, db, asc } from '$lib/server/db';
import { addWeeks, getISOWeek, getISOWeekYear } from 'date-fns';

export const load: PageServerLoad = async () => {
	const nextWeek = addWeeks(new Date(), 1);
	const targetYear = getISOWeekYear(nextWeek);
	const targetWeek = getISOWeek(nextWeek);

	const [animeSeasons, platforms] = await Promise.all([
		db
			.select()
			.from(schema.animeSeason)
			.orderBy(asc(schema.animeSeason.animeId), asc(schema.animeSeason.sequence)),
		db.select().from(schema.platform).orderBy(asc(schema.platform.name))
	]);

	return { animeSeasons, platforms, targetYear, targetWeek };
};
