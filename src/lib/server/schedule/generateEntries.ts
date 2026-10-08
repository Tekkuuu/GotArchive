import { schema, db, eq, and, or, inArray, sql } from '$lib/server/db';
import { desc, lt } from 'drizzle-orm';
import { startOfISOWeek, setISOWeek, setISOWeekYear } from 'date-fns';
import { parseEpisodeList } from '$lib/util/schedule/episodeProgressParser';
import {
	planWeek,
	type GeneratedEntry,
	type PlanSeason,
	type PlanSlot,
	type PreviousProgress
} from './planWeek';

export type { GeneratedEntry } from './planWeek';

export interface GenerateEntriesResult {
	entries: GeneratedEntry[];
}

/**
 * Generates entries for ISO week.
 * @param year - Year.
 * @param week - ISO week.
 * @returns Entries.
 */
export async function generateEntries(
	targetYear: number,
	targetWeek: number
): Promise<GenerateEntriesResult> {
	const slots = await db
		.select({
			slot: schema.scheduleSlot,
			anime: schema.anime,
			platforms: sql<
				Array<string>
			>`array_agg(${schema.platform.platformId} ORDER BY ${schema.platform.name} ASC)`
		})
		.from(schema.scheduleSlot)
		.leftJoin(schema.anime, eq(schema.scheduleSlot.animeId, schema.anime.animeId))
		.leftJoin(
			schema.scheduleSlotPlatform,
			eq(schema.scheduleSlot.scheduleSlotId, schema.scheduleSlotPlatform.scheduleSlotId)
		)
		.leftJoin(
			schema.platform,
			eq(schema.scheduleSlotPlatform.platformId, schema.platform.platformId)
		)
		.where(eq(schema.scheduleSlot.isActive, true))
		.groupBy(schema.scheduleSlot.scheduleSlotId, schema.anime.animeId)
		.orderBy(schema.scheduleSlot.dayOfWeek, schema.scheduleSlot.time);

	const animeSeasons = await db.select().from(schema.animeSeason);

	const animeIdsInSlots = [
		...new Set(slots.map((s) => s.slot.animeId).filter((id): id is string => id !== null))
	];

	// Starting point per anime.
	const previousProgress = new Map<string, PreviousProgress>();

	if (animeIdsInSlots.length > 0) {
		const latestEntryWeek = db.$with('latest_entry_week').as(
			db
				.selectDistinctOn([schema.animeSeason.animeId], {
					animeId: schema.animeSeason.animeId,
					scheduleId: schema.schedule.scheduleId
				})
				.from(schema.scheduleEntry)
				.innerJoin(schema.schedule, eq(schema.scheduleEntry.scheduleId, schema.schedule.scheduleId))
				.innerJoin(
					schema.scheduleEntryAnimeSeason,
					eq(schema.scheduleEntry.scheduleEntryId, schema.scheduleEntryAnimeSeason.scheduleEntryId)
				)
				.innerJoin(
					schema.animeSeason,
					eq(schema.scheduleEntryAnimeSeason.animeSeasonId, schema.animeSeason.animeSeasonId)
				)
				.where(
					and(
						inArray(schema.animeSeason.animeId, animeIdsInSlots),
						eq(schema.scheduleEntry.isCancelled, false),
						or(
							lt(schema.schedule.year, targetYear),
							and(eq(schema.schedule.year, targetYear), lt(schema.schedule.week, targetWeek))
						)
					)
				)
				.orderBy(schema.animeSeason.animeId, desc(schema.schedule.year), desc(schema.schedule.week))
		);

		const historyRows = await db
			.with(latestEntryWeek)
			.select({
				animeId: schema.animeSeason.animeId,
				sequence: schema.animeSeason.sequence,
				episodes: schema.scheduleEntryAnimeSeason.episodes
			})
			.from(latestEntryWeek)
			.innerJoin(
				schema.scheduleEntry,
				eq(schema.scheduleEntry.scheduleId, latestEntryWeek.scheduleId)
			)
			.innerJoin(
				schema.scheduleEntryAnimeSeason,
				eq(schema.scheduleEntryAnimeSeason.scheduleEntryId, schema.scheduleEntry.scheduleEntryId)
			)
			.innerJoin(
				schema.animeSeason,
				eq(schema.scheduleEntryAnimeSeason.animeSeasonId, schema.animeSeason.animeSeasonId)
			)
			.where(
				and(
					eq(schema.scheduleEntry.isCancelled, false),
					eq(schema.animeSeason.animeId, latestEntryWeek.animeId)
				)
			);

		// Winner per anime.
		const best = new Map<string, { sequence: number; maxEpisode: number }>();

		for (const row of historyRows) {
			const parsed = parseEpisodeList(row.episodes);
			const maxEpisode = parsed.length > 0 ? Math.max(...parsed) : 0;
			const current = best.get(row.animeId);

			if (
				!current ||
				row.sequence > current.sequence ||
				(row.sequence === current.sequence && maxEpisode > current.maxEpisode)
			) {
				best.set(row.animeId, { sequence: row.sequence, maxEpisode });
			}
		}

		for (const [animeId, value] of best) {
			previousProgress.set(animeId, { sequence: value.sequence, episode: value.maxEpisode + 1 });
		}
	}

	const weekStart = startOfISOWeek(setISOWeek(setISOWeekYear(new Date(), targetYear), targetWeek));

	const planSlots: PlanSlot[] = slots.map((slotData) => ({
		slotId: slotData.slot.scheduleSlotId,
		dayOfWeek: slotData.slot.dayOfWeek,
		time: slotData.slot.time,
		type: slotData.slot.type,
		animeId: slotData.slot.animeId,
		title: slotData.slot.title,
		description: slotData.slot.description,
		logoUrl: slotData.slot.logoUrl,
		episodeCount: slotData.slot.episodeCount,
		cancelledText: slotData.slot.cancelledText,
		note: slotData.slot.note,
		platforms: (slotData.platforms ?? []).filter((id): id is string => id !== null)
	}));

	const planSeasons: PlanSeason[] = animeSeasons.map((season) => ({
		animeSeasonId: season.animeSeasonId,
		animeId: season.animeId,
		sequence: season.sequence,
		episodes: season.episodes,
		episodeProgress: season.episodeProgress
	}));

	return { entries: planWeek(planSlots, planSeasons, previousProgress, weekStart) };
}
