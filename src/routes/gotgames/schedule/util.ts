import type { ScheduleEntryData, ScheduleAnimeSeasonInfo } from '$lib/api/schedule/datecode';

export { formatTime } from '$lib/util/scheduleEntry';

/**
 * Maps platform to display name.
 * @param platformName - Raw name.
 * @returns Short name.
 */
export function getPlatformDisplayName(platformName: string): string {
	if (platformName.toLowerCase().includes('youtube')) {
		return 'YouTube';
	} else if (platformName.toLowerCase().includes('patreon')) {
		return 'Patreon';
	} else if (platformName.toLowerCase().includes('twitch')) {
		return 'Twitch';
	} else if (platformName.toLowerCase().includes('rumble')) {
		return 'Rumble';
	} else if (platformName.toLowerCase().includes('kick')) {
		return 'Kick';
	} else {
		return platformName;
	}
}

/**
 * Resolves logo URL.
 * @param entry - Schedule entry.
 * @returns URL or null.
 */
export function getLogoUrl(entry: ScheduleEntryData): string | null {
	if (entry.logoUrl) {
		return entry.logoUrl;
	}

	if (entry.animeSeasons && entry.animeSeasons.length > 0) {
		const firstAnime = entry.animeSeasons[0];
		if (firstAnime.anime.logoUrl) {
			return firstAnime.anime.logoUrl;
		}
	}

	return null;
}

/**
 * Formats season display.
 * @param animeSeason - Season info.
 * @returns Title + episodes.
 */
export function formatAnimeSeasonDisplay(animeSeason: ScheduleAnimeSeasonInfo): string {
	const title =
		animeSeason.shortTitle ||
		animeSeason.titleEnglish ||
		animeSeason.titleRomaji ||
		animeSeason.titleNative ||
		animeSeason.anime.shortTitle ||
		animeSeason.anime.titleEnglish ||
		animeSeason.anime.titleRomaji ||
		animeSeason.anime.titleNative ||
		'Unknown Title';

	return `${title}`;
}
