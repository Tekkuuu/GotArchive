import type { Platform } from '$lib/server/db';
import type {
	ScheduleEntry,
	ScheduleTypeTimedateGroup,
	MultiAnimeScheduleEntry,
	WeekdayScheduleGroup
} from './types';
import _ from 'lodash';
import { startOfWeek, addDays, format } from 'date-fns';

/**
 * Groups schedule entries (anime and misc) by type, date, and time.
 * Each group contains only anime OR misc entries (never both).
 *
 * @param scheduleEntries - Array of raw schedule entries from the DB (each entry may have 'anime' or 'misc', never both).
 * @param platforms - Array of platforms.
 * @returns Array of MultiAnimeScheduleGroup, with discriminated entries.
 */
export function groupByTypeDatetime(
	scheduleEntries: ScheduleEntry[],
	platforms: Platform[]
): ScheduleTypeTimedateGroup[] {
	const platformMap = _.keyBy(platforms, 'platformId');

	// Group by type + date + time
	const groupMap = new Map<string, ScheduleTypeTimedateGroup>();

	for (const entry of scheduleEntries) {
		const schedule = entry.scheduleEntry;
		const key = `${schedule.type}|${schedule.date}|${schedule.time ?? '[NO_TIME]'}`;
		const platform = schedule.platformId ? platformMap[schedule.platformId] : undefined;

		if (!groupMap.has(key)) {
			groupMap.set(key, {
				type: schedule.type,
				date: schedule.date,
				time: schedule.time ?? null,
				entries: []
			});
		}

		// Handle anime entries
		if (entry.anime) {
			groupMap.get(key)!.entries.push({
				type: 'anime',
				scheduleEntryId: schedule.scheduleEntryId,
				animeId: entry.anime.animeId,
				sequence: entry.anime.sequence,
				titleEnglish: entry.anime.titleEnglish,
				titleNative: entry.anime.titleNative,
				titleRomaji: entry.anime.titleRomaji,
				episodes: entry.anime.episodes,
				watchedAfter: entry.anime.watchedAfter,
				platformName: platform?.name ?? '',
				platformUrl: platform?.url ?? ''
			});
		}

		// Handle misc entries
		if (entry.misc) {
			groupMap.get(key)!.entries.push({
				type: 'misc',
				scheduleEntryId: schedule.scheduleEntryId,
				title: entry.misc.title,
				description: entry.misc.description,
				platformName: platform?.name ?? '',
				platformUrl: platform?.url ?? ''
			});
		}
		// If BOTH are null, skip entry
	}

	return Array.from(groupMap.values());
}

/**
 * Groups MultiAnimeScheduleGroups into weekdays.
 * Each day's entries can include both anime and misc groups.
 */
export function groupByWeekdaysObjects(
	groups: ScheduleTypeTimedateGroup[]
): WeekdayScheduleGroup[] {
	if (!groups.length) return [];

	// Get the Monday of the current week based on the first group's date+time
	const nearsetDatetime = `${groups.at(0)?.date}T${groups.at(0)?.time ?? '00:00:00'}`;
	const monday = startOfWeek(new Date(nearsetDatetime), { weekStartsOn: 1 });

	// Prepare 7 weekdays
	const weekdays: WeekdayScheduleGroup[] = Array.from({ length: 7 }, (_, index) => ({
		date: format(addDays(monday, index), 'yyyy-MM-dd'),
		entries: []
	}));

	groups.forEach((group) => {
		// Use group.date (ISO string) to determine the day of week
		const groupDate = new Date(group.date);
		const dayOfWeek = groupDate.getDay();
		// JS: Sunday=0, Monday=1, ..., Saturday=6; we want Monday=0, ..., Sunday=6
		const index = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
		weekdays[index].entries.push(group);
	});

	return weekdays;
}

export function groupEntriesForDisplay(groups: ScheduleTypeTimedateGroup[]) {
	return groups.flatMap((group) =>
		processSingleEntryGroupEntries(group.entries, group.type, group.date, group.time)
	);
}

/**
 * Processes a group of schedule entries for a single type/datetime slot.
 * Handles both anime and misc entries.
 */
export function processSingleEntryGroupEntries(
	subEntries: MultiAnimeScheduleEntry[],
	_type: string,
	_date: string,
	_time: string | null
): Array<
	| {
			isMultiPlatformAnimeVariant?: true;
			animeId?: number;
			titleEnglish?: string | null;
			titleNative?: string;
			titleRomaji?: string | null;
			sequence?: number;
			episodes?: number[];
			platforms?: { platformUrl: string; platformName: string }[];
	  }
	| {
			isSinglePlatformShared?: true;
			platformUrl?: string;
			platformName?: string;
			animeList?: {
				animeId: number;
				titleEnglish: string | null;
				titleNative: string;
				titleRomaji: string | null;
				sequence: number;
				episodes: number[];
			}[];
	  }
	| {
			isMiscEntry: true;
			scheduleEntryId: number;
			title: string;
			description: string | null;
			platformName: string;
			platformUrl: string;
	  }
> {
	const displayBlocks: ReturnType<typeof processSingleEntryGroupEntries> = [];

	// Separate misc and anime entries
	const miscEntries = subEntries.filter((e) => e.type === 'misc') as Extract<
		MultiAnimeScheduleEntry,
		{ type: 'misc' }
	>[];
	const animeEntries = subEntries.filter((e) => e.type === 'anime') as Extract<
		MultiAnimeScheduleEntry,
		{ type: 'anime' }
	>[];

	// Handle misc entries (one block per misc)
	for (const misc of miscEntries) {
		displayBlocks.push({
			isMiscEntry: true,
			scheduleEntryId: misc.scheduleEntryId,
			title: misc.title,
			description: misc.description,
			platformName: misc.platformName,
			platformUrl: misc.platformUrl
		});
	}

	// Handle anime entries (existing logic)
	if (animeEntries.length === 1) {
		const uniqueEntry = animeEntries[0];
		displayBlocks.push({
			isMultiPlatformAnimeVariant: true,
			animeId: uniqueEntry.animeId,
			titleEnglish: uniqueEntry.titleEnglish,
			titleNative: uniqueEntry.titleNative,
			titleRomaji: uniqueEntry.titleRomaji,
			sequence: uniqueEntry.sequence,
			episodes: uniqueEntry.episodes,
			platforms: [{ platformUrl: uniqueEntry.platformUrl, platformName: uniqueEntry.platformName }]
		});
		return displayBlocks;
	}

	// Step 1: Identify and handle Rule 1 cases (same anime/seq/ep, multiple platforms)
	const groupedByAnimeVariantIdentity = _.groupBy(
		animeEntries,
		(e) => `${e.animeId}|${e.sequence}|${e.episodes.join(',')}`
	);
	const entriesForRules2and3Processing: typeof animeEntries = [];

	for (const key in groupedByAnimeVariantIdentity) {
		const entriesInGroup = groupedByAnimeVariantIdentity[key];
		const firstEntry = entriesInGroup[0];

		const uniquePlatforms = _.uniqBy(
			entriesInGroup.map((e) => ({
				platformUrl: e.platformUrl,
				platformName: e.platformName
			})),
			'platformUrl'
		);

		if (uniquePlatforms.length > 1) {
			// Rule 1 case: one anime variant, multiple platforms
			displayBlocks.push({
				isMultiPlatformAnimeVariant: true,
				animeId: firstEntry.animeId,
				titleEnglish: firstEntry.titleEnglish,
				titleNative: firstEntry.titleNative,
				titleRomaji: firstEntry.titleRomaji,
				sequence: firstEntry.sequence,
				episodes: firstEntry.episodes,
				platforms: uniquePlatforms
			});
		} else {
			// This variant has only one (or zero) distinct platform. Pass original entries to next stage.
			entriesForRules2and3Processing.push(...entriesInGroup);
		}
	}

	// Step 2: Process remaining entries for Rules 2 & 3 (group by single platform)
	const groupedByPlatformUrl = _.groupBy(entriesForRules2and3Processing, (e) => e.platformUrl);

	for (const platformUrl in groupedByPlatformUrl) {
		const entriesSharingThisPlatform = groupedByPlatformUrl[platformUrl];
		if (entriesSharingThisPlatform.length === 0) continue;

		const platformName = entriesSharingThisPlatform[0].platformName;

		// Collect all unique anime/sequence/episode combinations for this platform
		const animeListForThisPlatform = _.map(
			_.groupBy(
				entriesSharingThisPlatform,
				(e) => `${e.animeId}|${e.sequence}|${e.episodes.join(',')}`
			),
			(variantEntries) => {
				const firstVariantEntry = variantEntries[0];
				return {
					animeId: firstVariantEntry.animeId,
					titleEnglish: firstVariantEntry.titleEnglish,
					titleNative: firstVariantEntry.titleNative,
					titleRomaji: firstVariantEntry.titleRomaji,
					sequence: firstVariantEntry.sequence,
					episodes: firstVariantEntry.episodes
				};
			}
		).sort((a, b) => a.titleNative.localeCompare(b.titleNative)); // Sort for consistent order

		displayBlocks.push({
			isSinglePlatformShared: true,
			platformUrl: platformUrl,
			platformName: platformName,
			animeList: animeListForThisPlatform
		});
	}

	return displayBlocks;
}
