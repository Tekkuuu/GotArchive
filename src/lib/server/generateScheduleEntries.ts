import { schema, db, eq, asc, sql, desc, inArray, and, or } from '$lib/server/db';
import { lt } from 'drizzle-orm';
import { startOfISOWeek, addDays, format, setISOWeek, setISOWeekYear } from 'date-fns';
import { parseEpisodeList } from '$lib/util/schedule/episodeProgressParser';
import type { EntryType } from '$lib/schemas/common';

export interface GeneratedEntry {
	type: EntryType;
	date: string;
	time: string | null;
	note: string | null;
	logoUrl: string | null;
	title: string | null;
	description: string | null;
	cancelledText: string | null;
	isCancelled: boolean;
	anime: Array<{ animeSeasonId: string; episodes: string }> | null;
	platforms: string[] | null;
	slotId: string;
}

export interface GenerateEntriesResult {
	entries: GeneratedEntry[];
	slotsToReset: string[];
}

/**
 * Generates schedule entries from active slots for a given ISO year and week.
 *
 * Episode calculation priority (first occurrence of an anime per schedule):
 *   1. slot.startingSequence + slot.startingEpisode set → use them as a one-shot force-restart/bootstrap;
 *      record the slotId in slotsToReset so the caller can clear those fields after saving.
 *   2. Walk history backwards (most-recent week first). For each week, collect all entries for this
 *      anime. Filter to non-cancelled entries. If any exist, take the global max episode across all
 *      non-cancelled entries in that week → maxEp + 1. If ALL entries in a week are cancelled,
 *      skip that week and try the previous one.
 *   3. animeSeason with highest sequence → episodeProgress + 1
 *   4. sequence = 1, episode = 1
 *
 * Subsequent occurrences of the same anime within the same schedule continue from the running
 * animeProgress map (unchanged).
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
		.orderBy(asc(schema.scheduleSlot.dayOfWeek), asc(schema.scheduleSlot.time));

	const animeSeasons = await db
		.select()
		.from(schema.animeSeason)
		.orderBy(asc(schema.animeSeason.animeId), asc(schema.animeSeason.sequence));

	const animeIdsInSlots = [
		...new Set(slots.filter((s) => s.slot.animeId !== null).map((s) => s.slot.animeId))
	];

	// -------------------------------------------------------------------------
	// Build history map: for each anime, walk weeks backwards and find the most
	// recent week with at least one non-cancelled entry. Take the global max
	// episode across all non-cancelled entries in that week.
	// -------------------------------------------------------------------------
	const previousAnimeProgress = new Map<string, { sequence: number; episode: number }>();

	if (animeIdsInSlots.length > 0) {
		const previousEntries = await db
			.select({
				animeId: schema.animeSeason.animeId,
				sequence: schema.animeSeason.sequence,
				episodes: schema.scheduleEntryAnimeSeason.episodes,
				isCancelled: schema.scheduleEntry.isCancelled,
				year: schema.schedule.year,
				week: schema.schedule.week
			})
			.from(schema.scheduleEntry)
			.innerJoin(
				schema.scheduleEntryAnimeSeason,
				eq(schema.scheduleEntry.scheduleEntryId, schema.scheduleEntryAnimeSeason.scheduleEntryId)
			)
			.innerJoin(
				schema.animeSeason,
				eq(schema.scheduleEntryAnimeSeason.animeSeasonId, schema.animeSeason.animeSeasonId)
			)
			.innerJoin(schema.schedule, eq(schema.scheduleEntry.scheduleId, schema.schedule.scheduleId))
			.where(
				and(
					inArray(schema.animeSeason.animeId, animeIdsInSlots as string[]),
					or(
						lt(schema.schedule.year, targetYear),
						and(eq(schema.schedule.year, targetYear), lt(schema.schedule.week, targetWeek))
					)
				)
			)
			.orderBy(desc(schema.schedule.year), desc(schema.schedule.week));

		// Group entries by (animeId, year, week)
		// Structure: animeId → Map<"year-week", { hasNonCancelled: boolean; maxEpisode: number; maxSequence: number }>
		type WeekProgress = { hasNonCancelled: boolean; maxEpisode: number; maxSequence: number };
		const historyByAnime = new Map<string, Map<string, WeekProgress>>();

		for (const entry of previousEntries) {
			if (!entry.animeId) continue;

			if (!historyByAnime.has(entry.animeId)) {
				historyByAnime.set(entry.animeId, new Map());
			}
			const weekMap = historyByAnime.get(entry.animeId)!;
			const weekKey = `${entry.year}-${entry.week}`;

			if (!weekMap.has(weekKey)) {
				weekMap.set(weekKey, { hasNonCancelled: false, maxEpisode: 0, maxSequence: 0 });
			}
			const weekProgress = weekMap.get(weekKey)!;

			if (!entry.isCancelled) {
				const parsedEpisodes = parseEpisodeList(entry.episodes);
				if (parsedEpisodes.length > 0) {
					const maxEp = Math.max(...parsedEpisodes);
					if (
						!weekProgress.hasNonCancelled ||
						entry.sequence > weekProgress.maxSequence ||
						(entry.sequence === weekProgress.maxSequence && maxEp > weekProgress.maxEpisode)
					) {
						weekProgress.hasNonCancelled = true;
						weekProgress.maxSequence = entry.sequence;
						weekProgress.maxEpisode = maxEp;
					}
				}
			}
		}

		// For each anime, iterate weeks most-recent-first and find the first week
		// that has at least one non-cancelled entry.
		for (const [animeId, weekMap] of historyByAnime) {
			// Sort week keys descending (year DESC, week DESC)
			const sortedWeeks = [...weekMap.keys()].sort((a, b) => {
				const [aYear, aWeek] = a.split('-').map(Number);
				const [bYear, bWeek] = b.split('-').map(Number);
				if (aYear !== bYear) return bYear - aYear;
				return bWeek - aWeek;
			});

			for (const weekKey of sortedWeeks) {
				const wp = weekMap.get(weekKey)!;
				if (wp.hasNonCancelled) {
					previousAnimeProgress.set(animeId, {
						sequence: wp.maxSequence,
						episode: wp.maxEpisode + 1
					});
					break;
				}
				// All entries in this week were cancelled — try the previous week
			}
		}
	}

	// -------------------------------------------------------------------------
	// Sort slots by day and time, then generate entries
	// -------------------------------------------------------------------------
	const sortedSlots = slots.slice().sort((a, b) => {
		if (a.slot.dayOfWeek !== b.slot.dayOfWeek) return a.slot.dayOfWeek - b.slot.dayOfWeek;
		if (a.slot.time && b.slot.time) return a.slot.time.localeCompare(b.slot.time);
		return 0;
	});

	// Compute the Monday of the target ISO week
	const weekStart = startOfISOWeek(setISOWeek(setISOWeekYear(new Date(), targetYear), targetWeek));

	const animeProgress = new Map<string, { sequence: number; episode: number }>();
	const entries: GeneratedEntry[] = [];
	const slotsToReset: string[] = [];

	for (const slotData of sortedSlots) {
		const { slot } = slotData;

		const dayOffset = slot.dayOfWeek;
		const entryDate = addDays(weekStart, dayOffset);
		const dateStr = format(entryDate, 'yyyy-MM-dd');

		const platformIds = slotData.platforms?.filter((id): id is string => id !== null) || [];

		if (slot.type === 'anime' && slot.animeId) {
			const animeSeasonsForAnime = animeSeasons.filter((s) => s.animeId === slot.animeId);

			// First occurrence of this anime in this schedule — determine starting point
			if (!animeProgress.has(slot.animeId)) {
				let sequence: number;
				let episode: number;

				if (slot.startingSequence != null && slot.startingEpisode != null) {
					// Priority 1: force-restart / bootstrap override
					sequence = slot.startingSequence;
					episode = slot.startingEpisode;
					slotsToReset.push(slot.scheduleSlotId);
				} else if (previousAnimeProgress.has(slot.animeId)) {
					// Priority 2: most recent non-cancelled history
					sequence = previousAnimeProgress.get(slot.animeId)!.sequence;
					episode = previousAnimeProgress.get(slot.animeId)!.episode;
				} else {
					// Priority 3: highest-sequence season's episodeProgress + 1
					const latestSeason = animeSeasonsForAnime
						.slice()
						.sort((a, b) => b.sequence - a.sequence)[0];
					if (latestSeason) {
						sequence = latestSeason.sequence;
						episode = (latestSeason.episodeProgress || 0) + 1;
					} else {
						// Priority 4: start from scratch
						sequence = 1;
						episode = 1;
					}
				}

				// Skip this slot if the starting season doesn't exist or has no episodes,
				// or if the starting episode exceeds the season's max
				const startSeason = animeSeasonsForAnime.find((s) => s.sequence === sequence);
				const seasonMaxEpisodes = startSeason?.episodes ?? 0;
				if (!startSeason || seasonMaxEpisodes === 0 || episode > seasonMaxEpisodes) {
					continue;
				}

				animeProgress.set(slot.animeId, { sequence, episode });
			}

			const currentProgress = animeProgress.get(slot.animeId)!;
			const epCount = slot.episodeCount || 1;

			// Build anime season entries (may span multiple seasons)
			const animeSeasonEntries: Array<{ animeSeasonId: string; episodes: string }> = [];
			let remainingEpisodes = epCount;
			let currentEpisode = currentProgress.episode;
			let currentSeq = currentProgress.sequence;

			while (remainingEpisodes > 0) {
				const currentSeason = animeSeasonsForAnime.find((s) => s.sequence === currentSeq);
				if (!currentSeason) break;

				const seasonMaxEpisodes = currentSeason.episodes || 1;
				const episodesInCurrentSeason = Math.min(
					remainingEpisodes,
					seasonMaxEpisodes - currentEpisode + 1
				);

				if (episodesInCurrentSeason > 0) {
					const episodeStart = currentEpisode;
					const episodeEnd = currentEpisode + episodesInCurrentSeason - 1;

					animeSeasonEntries.push({
						animeSeasonId: currentSeason.animeSeasonId,
						episodes:
							episodeStart === episodeEnd ? `${episodeStart}` : `${episodeStart}-${episodeEnd}`
					});

					remainingEpisodes -= episodesInCurrentSeason;

					if (episodeEnd >= seasonMaxEpisodes) {
						currentSeq++;
						currentEpisode = 1;
					} else {
						currentEpisode = episodeEnd + 1;
					}
				} else {
					currentSeq++;
					currentEpisode = 1;
				}
			}

			// Skip if anime has ended (no episodes added)
			if (animeSeasonEntries.length === 0) continue;

			entries.push({
				type: 'anime',
				date: dateStr,
				time: slot.time,
				note: slot.note,
				logoUrl: slot.logoUrl,
				title: slot.title,
				description: slot.description,
				cancelledText: slot.cancelledText,
				isCancelled: false,
				anime: animeSeasonEntries,
				platforms: platformIds.length > 0 ? platformIds : null,
				slotId: slot.scheduleSlotId
			});

			// Update running progress to the next episode
			currentProgress.sequence = currentSeq;
			currentProgress.episode = currentEpisode;
		} else {
			const entryType: EntryType =
				slot.type != null &&
				['anime', 'hololive', 'game', 'event', 'sponsored', 'misc'].includes(slot.type)
					? (slot.type as EntryType)
					: 'misc';
			entries.push({
				type: entryType,
				date: dateStr,
				time: slot.time,
				note: slot.note,
				logoUrl: slot.logoUrl,
				title: slot.title,
				description: slot.description,
				cancelledText: slot.cancelledText,
				isCancelled: false,
				anime: null,
				platforms: platformIds.length > 0 ? platformIds : null,
				slotId: slot.scheduleSlotId
			});
		}
	}

	return { entries, slotsToReset };
}
