import type { Platform } from "$lib/server/db";
import type {
  MultiAnimeScheduleGroup,
  WeekdayScheduleGroup,
} from "./types";
import type {
  ScheduleEntry
} from '$lib/hooks';
import { addDays, format, startOfWeek } from 'date-fns';
import _ from 'lodash';

export function groupScheduleEntries(
  scheduleEntries: ScheduleEntry[],
  platforms: Platform[]
): MultiAnimeScheduleGroup[] {
  const platformMap = _.keyBy(platforms, 'platformId');

  // Group by type + date + time
  const groupMap = new Map<string, MultiAnimeScheduleGroup>();

  for (const entry of scheduleEntries) {
    const anime = entry.anime;
    const schedule = entry.scheduleEntry;
    const key = `${schedule.type}|${schedule.date}|${schedule.time ?? '[NO_TIME]'}`;

    // Lookup platform details
    const platform = schedule.platformId ? platformMap[schedule.platformId] : undefined;

    if (!groupMap.has(key)) {
      groupMap.set(key, {
        type: schedule.type,
        date: schedule.date,
        time: schedule.time ?? null,
        entries: [],
      });
    }

    groupMap.get(key)!.entries.push({
      scheduleEntryId: schedule.scheduleEntryId,
      animeId: anime.animeId,
      titleEnglish: anime.titleEnglish,
      titleNative: anime.titleNative,
      titleRomaji: anime.titleRomaji,
      sequence: anime.sequence,
      episodes: anime.episodes,
      platformName: platform?.name ?? '',
      platformUrl: platform?.url ?? '',
    });
  }

  return Array.from(groupMap.values());
}

export function groupByWeekdaysObjects(groups: MultiAnimeScheduleGroup[]): WeekdayScheduleGroup[] {
  // Get the Monday of the current week
  const nearsetDatetime = `${groups.at(0)?.date}T${groups.at(0)?.time ?? '00:00:00'}`;
  const monday = startOfWeek(new Date(nearsetDatetime), { weekStartsOn: 1 });
  // Prepare 7 weekdays
  const weekdays: WeekdayScheduleGroup[] = Array.from({ length: 7 }, (_, index) => ({
    date: format(addDays(monday, index), "yyyy-MM-dd"),
    entries: [],
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

export function groupEntriesForDisplay(groups: MultiAnimeScheduleGroup[]) {
  return groups.flatMap(group =>
    processSingleEntryGroupEntries(group.entries, group.type, group.date, group.time)
  );
}

/**
 * Processes a group of schedule entries for a single type/datetime slot and organizes them
 * into display blocks according to the following rules:
 *
 * Rule 1: If there are entries with the same animeId, sequence, and episodes but different platforms,
 *         group them into a single display block with a list of platforms.
 *
 * Rule 2: For entries with the same animeId, type, datetime, and platform but different sequences/episodes,
 *         group them under the same platform, listing each anime/sequence/episodes variant.
 *
 * Rule 3: For entries with the same datetime, type, and platform but different animeIds,
 *         group them under the same platform, listing each anime and its episodes.
 *
 * If there is only a single entry for this type/datetime slot, it is treated as Rule 1 for consistent display.
 *
 * @param subEntries - The entries to process for a single type/datetime slot.
 * @param _type - The type of the schedule group (unused, but available for future logic).
 * @param _datetime - The datetime of the schedule group (unused, but available for future logic).
 * @returns An array of display blocks, each representing either a multi-platform anime variant
 *          or a single-platform group with one or more anime/variants.
 */
function processSingleEntryGroupEntries(
  subEntries: MultiAnimeScheduleGroup['entries'],
  _type: string,
  _date: string,
  _time: string | null
): Array<{
  isMultiPlatformAnimeVariant?: true;
  animeId?: number;
  titleEnglish?: string | null;
  titleNative?: string;
  titleRomaji?: string | null;
  sequence?: number;
  episodes?: number[];
  platforms?: { platformUrl: string; platformName: string }[];

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
}> {
  const displayBlocks: ReturnType<typeof processSingleEntryGroupEntries> = [];

  /**
   * If there is only a single entry for this type/datetime slot,
   * treat it as a multi-platform anime variant (Rule 1) for display purposes.
   * This ensures consistent UI structure even for solitary entries.
   */
  if (subEntries.length === 1) {
    const uniqueEntry = subEntries[0];
    displayBlocks.push({
      isMultiPlatformAnimeVariant: true,
      animeId: uniqueEntry.animeId,
      titleEnglish: uniqueEntry.titleEnglish,
      titleNative: uniqueEntry.titleNative,
      titleRomaji: uniqueEntry.titleRomaji,
      sequence: uniqueEntry.sequence,
      episodes: uniqueEntry.episodes,
      platforms: [{ platformUrl: uniqueEntry.platformUrl, platformName: uniqueEntry.platformName }],
    });
    return displayBlocks;
  }

  // Step 1: Identify and handle Rule 1 cases (same anime/seq/ep, multiple platforms)
  const groupedByAnimeVariantIdentity = _.groupBy(subEntries, e => `${e.animeId}|${e.sequence}|${e.episodes.join(',')}`);
  const entriesForRules2and3Processing: typeof subEntries = [];

  for (const key in groupedByAnimeVariantIdentity) {
    const entriesInGroup = groupedByAnimeVariantIdentity[key];
    const firstEntry = entriesInGroup[0];

    const uniquePlatforms = _.uniqBy(
      entriesInGroup.map(e => ({ platformUrl: e.platformUrl, platformName: e.platformName })),
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
        platforms: uniquePlatforms,
      });
    } else {
      // This variant has only one (or zero) distinct platform. Pass original entries to next stage.
      entriesForRules2and3Processing.push(...entriesInGroup);
    }
  }

  // Step 2: Process remaining entries for Rules 2 & 3 (group by single platform)
  const groupedByPlatformUrl = _.groupBy(entriesForRules2and3Processing, e => e.platformUrl);

  for (const platformUrl in groupedByPlatformUrl) {
    const entriesSharingThisPlatform = groupedByPlatformUrl[platformUrl];
    if (entriesSharingThisPlatform.length === 0) continue;

    const platformName = entriesSharingThisPlatform[0].platformName;

    // Collect all unique anime/sequence/episode combinations for this platform
    const animeListForThisPlatform = _.map(
      _.groupBy(entriesSharingThisPlatform, e => `${e.animeId}|${e.sequence}|${e.episodes.join(',')}`),
      (variantEntries) => {
        const firstVariantEntry = variantEntries[0];
        return {
          animeId: firstVariantEntry.animeId,
          titleEnglish: firstVariantEntry.titleEnglish,
          titleNative: firstVariantEntry.titleNative,
          titleRomaji: firstVariantEntry.titleRomaji,
          sequence: firstVariantEntry.sequence,
          episodes: firstVariantEntry.episodes,
        };
      }
    ).sort((a, b) => a.titleNative.localeCompare(b.titleNative)); // Sort for consistent order

    displayBlocks.push({
      isSinglePlatformShared: true,
      platformUrl: platformUrl,
      platformName: platformName,
      animeList: animeListForThisPlatform,
    });
  }
  return displayBlocks;
}
