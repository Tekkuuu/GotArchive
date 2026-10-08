import { addDays, format } from 'date-fns';
import type { EntryType } from '$lib/schemas';

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

export interface PlanSlot {
	slotId: string;
	dayOfWeek: number;
	time: string | null;
	type: EntryType | null;
	animeId: string | null;
	title: string | null;
	description: string | null;
	logoUrl: string | null;
	episodeCount: number | null;
	cancelledText: string | null;
	note: string | null;
	platforms: string[];
}

export interface PlanSeason {
	animeSeasonId: string;
	animeId: string;
	sequence: number;
	episodes: number | null;
	episodeProgress: number;
}

export interface PreviousProgress {
	sequence: number;
	episode: number;
}

/**
 * Plans concrete entries for ISO week.
 * @param slots - Active slots.
 * @param seasons - Anime seasons.
 * @param previousProgress - Start points.
 * @returns Entries.
 */
export function planWeek(
	slots: PlanSlot[],
	seasons: PlanSeason[],
	previousProgress: Map<string, PreviousProgress>,
	weekStart: Date
): GeneratedEntry[] {
	const sortedSlots = slots.slice().sort((a, b) => {
		if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
		if (a.time && b.time) return a.time.localeCompare(b.time);
		return 0;
	});

	const animeProgress = new Map<string, PreviousProgress>();
	const entries: GeneratedEntry[] = [];

	for (const slot of sortedSlots) {
		const dateStr = format(addDays(weekStart, slot.dayOfWeek), 'yyyy-MM-dd');
		const platforms = slot.platforms.length > 0 ? slot.platforms : null;

		if (slot.type === 'anime' && slot.animeId) {
			const seasonsForAnime = seasons.filter((s) => s.animeId === slot.animeId);

			// Bootstrap start point.
			if (!animeProgress.has(slot.animeId)) {
				let sequence: number;
				let episode: number;

				const previous = previousProgress.get(slot.animeId);
				if (previous) {
					({ sequence, episode } = previous);
				} else {
					const latestSeason = seasonsForAnime.slice().sort((a, b) => b.sequence - a.sequence)[0];
					if (latestSeason) {
						sequence = latestSeason.sequence;
						episode = (latestSeason.episodeProgress || 0) + 1;
					} else {
						sequence = 1;
						episode = 1;
					}
				}

				// Skip missing/ended seasons.
				const startSeason = seasonsForAnime.find((s) => s.sequence === sequence);
				const seasonMaxEpisodes = startSeason?.episodes ?? 0;
				if (!startSeason || seasonMaxEpisodes === 0 || episode > seasonMaxEpisodes) {
					continue;
				}

				animeProgress.set(slot.animeId, { sequence, episode });
			}

			const currentProgress = animeProgress.get(slot.animeId)!;
			const epCount = slot.episodeCount || 1;

			// May span seasons.
			const animeSeasonEntries: Array<{ animeSeasonId: string; episodes: string }> = [];
			let remainingEpisodes = epCount;
			let currentEpisode = currentProgress.episode;
			let currentSeq = currentProgress.sequence;

			while (remainingEpisodes > 0) {
				const currentSeason = seasonsForAnime.find((s) => s.sequence === currentSeq);
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

			// Skip ended anime.
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
				platforms,
				slotId: slot.slotId
			});

			currentProgress.sequence = currentSeq;
			currentProgress.episode = currentEpisode;
		} else {
			entries.push({
				type: slot.type ?? 'misc',
				date: dateStr,
				time: slot.time,
				note: slot.note,
				logoUrl: slot.logoUrl,
				title: slot.title,
				description: slot.description,
				cancelledText: slot.cancelledText,
				isCancelled: false,
				anime: null,
				platforms,
				slotId: slot.slotId
			});
		}
	}

	return entries;
}
