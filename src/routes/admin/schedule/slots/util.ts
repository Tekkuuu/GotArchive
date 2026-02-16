export const DAY_NAMES = [
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday',
	'Sunday'
] as const;

export const SCHEDULE_ENTRY_TYPES = [
	{ value: 'anime', label: 'Anime' },
	{ value: 'hololive', label: 'Hololive' },
	{ value: 'game', label: 'Game' },
	{ value: 'event', label: 'Event' },
	{ value: 'sponsored', label: 'Sponsored' },
	{ value: 'misc', label: 'Misc' }
] as const;

/**
 * Maps database dayOfWeek (0=Sunday, 6=Saturday) to display index (0=Monday, 6=Sunday)
 */
export function dbDayToDisplayDay(dbDay: number): number {
	// 0=Sunday -> 6, 1=Monday -> 0, 2=Tuesday -> 1, ..., 6=Saturday -> 5
	return dbDay === 0 ? 6 : dbDay - 1;
}

/**
 * Maps display day index (0=Monday, 6=Sunday) to database dayOfWeek (0=Sunday, 6=Saturday)
 */
export function displayDayToDbDay(displayDay: number): number {
	// 0=Monday -> 1, 1=Tuesday -> 2, ..., 5=Saturday -> 6, 6=Sunday -> 0
	return displayDay === 6 ? 0 : displayDay + 1;
}

type SlotData = {
	slot: {
		scheduleSlotId: string;
		animeId: string | null;
		startingSequence: number | null;
		startingEpisode: number | null;
		episodeCount: number | null;
		dayOfWeek: number;
		isActive: boolean;
	};
};

type AnimeSeasonData = {
	animeSeasonId: string;
	animeId: string;
	sequence: number;
	episodes: number | null;
};

/**
 * Calculate the next episode for a schedule slot
 */
export function calculateNextEpisode(
	slot: SlotData,
	animeSeasons: AnimeSeasonData[],
	allSlots: SlotData[]
): { sequence: number; episode: number } | null {
	const { animeId, startingSequence, startingEpisode } = slot.slot;

	// If no anime or starting point is set, cannot calculate
	if (!animeId || !startingSequence || !startingEpisode) {
		return null;
	}

	// Filter seasons for this anime and sort by sequence
	const seasons = animeSeasons
		.filter((s) => s.animeId === animeId)
		.sort((a, b) => a.sequence - b.sequence);

	if (seasons.length === 0) {
		return null;
	}

	// Always use startingSequence and startingEpisode as the base
	let currentSeq = startingSequence;
	let currentEp = startingEpisode;

	// Get all slots for this anime sorted by day of week (to simulate week progression)
	const slotsForAnime = allSlots
		.filter((s) => s.slot.animeId === animeId && s.slot.isActive)
		.sort((a, b) => {
			// Sort by day of week, then by time if available
			if (a.slot.dayOfWeek !== b.slot.dayOfWeek) {
				return a.slot.dayOfWeek - b.slot.dayOfWeek;
			}
			return 0;
		});

	// Find the current slot's position in the week
	const currentSlotIndex = slotsForAnime.findIndex(
		(s) => s.slot.scheduleSlotId === slot.slot.scheduleSlotId
	);

	if (currentSlotIndex === -1) {
		return null;
	}

	// Calculate how many episodes have been "consumed" by previous slots in the week
	for (let i = 0; i < currentSlotIndex; i++) {
		const prevSlot = slotsForAnime[i];
		const prevEpCount = prevSlot.slot.episodeCount || 1;

		currentEp += prevEpCount;

		// Check if we've exceeded the current season's episode count
		const currentSeason = seasons.find((s) => s.sequence === currentSeq);
		if (currentSeason && currentSeason.episodes && currentEp > currentSeason.episodes) {
			// Move to next season
			const overflow = currentEp - currentSeason.episodes;
			currentSeq++;
			currentEp = overflow;

			// Check if next season exists
			const nextSeason = seasons.find((s) => s.sequence === currentSeq);
			if (!nextSeason) {
				// No more seasons, cap at last episode of last season
				return {
					sequence: currentSeason.sequence,
					episode: currentSeason.episodes
				};
			}

			// Check if overflow exceeds the new season
			if (nextSeason.episodes && currentEp > nextSeason.episodes) {
				return {
					sequence: nextSeason.sequence,
					episode: nextSeason.episodes
				};
			}
		}
	}

	// Ensure we don't exceed the current season's episode count
	const finalSeason = seasons.find((s) => s.sequence === currentSeq);
	if (finalSeason && finalSeason.episodes && currentEp > finalSeason.episodes) {
		return {
			sequence: currentSeq,
			episode: finalSeason.episodes
		};
	}

	return {
		sequence: currentSeq,
		episode: currentEp
	};
}
