import { format } from 'date-fns';
import type { ScheduleEntryData, ScheduleAnimeSeasonInfo } from '$lib/api/schedule/datecode';

/**
 * Map platform names to shorter display names
 */
export function getPlatformDisplayName(platformName: string): string {
	if (platformName.toLowerCase().includes('youtube')) {
		return 'YouTube';
	} else if (platformName.toLowerCase().includes('patreon')) {
		return 'Patreon';
	} else if (platformName.toLowerCase().includes('twitch')) {
		return 'Twitch';
	} else {
		return platformName; // Default to original name if no match
	}
}

/**
 * Format time string to HH:mm format or return "No time"
 */
export function formatTime(timeStr: string | null): string {
	if (!timeStr) return 'No time';
	try {
		return format(new Date(`1970-01-01T${timeStr}`), 'HH:mm');
	} catch {
		return timeStr;
	}
}

/**
 * Get logo URL with 3-tier fallback:
 * 1. Entry's direct logoUrl
 * 2. First anime season's anime logoUrl
 * 3. null (will show empty space)
 */
export function getLogoUrl(entry: ScheduleEntryData): string | null {
	// First priority: entry's direct logo
	if (entry.logoUrl) {
		return entry.logoUrl;
	}

	// Second priority: anime's logo (from first anime season)
	if (entry.animeSeasons && entry.animeSeasons.length > 0) {
		const firstAnime = entry.animeSeasons[0];
		if (firstAnime.anime.logoUrl) {
			return firstAnime.anime.logoUrl;
		}
	}

	// No logo found
	return null;
}

/**
 * Format anime season info for display
 * Returns title and episodes string like "Frieren E1-4"
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
