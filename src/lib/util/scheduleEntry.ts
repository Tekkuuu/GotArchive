import type { AnimeSeason } from '$lib/server/db';
import { format } from 'date-fns';

/** Minimal shape used for the shared anime/season selectors. */
export interface SeasonSelection {
	animeSeasonId: string;
	episodes: string;
}

/**
 * Formats a `HH:mm:ss` time string to `HH:mm`.
 *
 * @param timeStr - Raw time from the database, or `null`.
 * @param options.utc - Treat the time as UTC (append `Z`) before formatting.
 * @param options.empty - Value returned when `timeStr` is falsy.
 */
export function formatTime(
	timeStr: string | null,
	options: { utc?: boolean; empty?: string } = {}
): string {
	const { utc = false, empty = 'No time' } = options;
	if (!timeStr) return empty;
	try {
		return format(new Date(`1970-01-01T${timeStr}${utc ? 'Z' : ''}`), 'HH:mm');
	} catch {
		return timeStr;
	}
}

/**
 * Builds unique anime list from seasons.
 * @param seasons - Seasons.
 * @returns Anime id/title pairs.
 */
export function uniqueAnime(
	seasons: AnimeSeason[] | undefined
): Array<{ animeId: string; title: string }> {
	if (!seasons) return [];

	const animeMap = new Map<string, { animeId: string; title: string }>();

	for (const season of seasons) {
		if (!animeMap.has(season.animeId)) {
			animeMap.set(season.animeId, {
				animeId: season.animeId,
				title: season.titleEnglish || season.titleRomaji || season.titleNative || 'Unknown'
			});
		}
	}

	return Array.from(animeMap.values()).sort((a, b) => a.title.localeCompare(b.title));
}

/** Filters a season list down to the seasons belonging to `selectedAnimeId`. */
export function filteredSeasons(
	seasons: AnimeSeason[] | undefined,
	selectedAnimeId: string | null
): AnimeSeason[] {
	if (!selectedAnimeId) return [];
	return seasons?.filter((s) => s.animeId === selectedAnimeId) ?? [];
}

/** Adds a season to the selection if not already present, defaulting to episode `'1'`. */
export function addSeasonSelection(
	current: SeasonSelection[],
	seasonId: string
): SeasonSelection[] {
	if (current.some((s) => s.animeSeasonId === seasonId)) return current;
	return [...current, { animeSeasonId: seasonId, episodes: '1' }];
}

/** Removes a season from the selection. */
export function removeSeasonSelection(
	current: SeasonSelection[],
	seasonId: string
): SeasonSelection[] {
	return current.filter((s) => s.animeSeasonId !== seasonId);
}

/** Looks up full season metadata by id. */
export function getSeasonInfo(
	seasons: AnimeSeason[] | undefined,
	seasonId: string
): AnimeSeason | undefined {
	return seasons?.find((s) => s.animeSeasonId === seasonId);
}
