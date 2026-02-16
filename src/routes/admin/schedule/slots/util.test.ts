import { describe, it, expect } from 'vitest';
import { dbDayToDisplayDay, displayDayToDbDay, calculateNextEpisode } from './util';

describe('Day conversion functions', () => {
	describe('dbDayToDisplayDay', () => {
		it('converts Sunday (0) to last position (6)', () => {
			expect(dbDayToDisplayDay(0)).toBe(6);
		});

		it('converts Monday (1) to first position (0)', () => {
			expect(dbDayToDisplayDay(1)).toBe(0);
		});

		it('converts Saturday (6) to position 5', () => {
			expect(dbDayToDisplayDay(6)).toBe(5);
		});

		it('converts all weekdays correctly', () => {
			expect(dbDayToDisplayDay(2)).toBe(1); // Tuesday
			expect(dbDayToDisplayDay(3)).toBe(2); // Wednesday
			expect(dbDayToDisplayDay(4)).toBe(3); // Thursday
			expect(dbDayToDisplayDay(5)).toBe(4); // Friday
		});
	});

	describe('displayDayToDbDay', () => {
		it('converts first position (0/Monday) to DB value 1', () => {
			expect(displayDayToDbDay(0)).toBe(1);
		});

		it('converts last position (6/Sunday) to DB value 0', () => {
			expect(displayDayToDbDay(6)).toBe(0);
		});

		it('converts position 5 (Saturday) to DB value 6', () => {
			expect(displayDayToDbDay(5)).toBe(6);
		});

		it('converts all display positions correctly', () => {
			expect(displayDayToDbDay(1)).toBe(2); // Tuesday
			expect(displayDayToDbDay(2)).toBe(3); // Wednesday
			expect(displayDayToDbDay(3)).toBe(4); // Thursday
			expect(displayDayToDbDay(4)).toBe(5); // Friday
		});
	});

	describe('round-trip conversion', () => {
		it('converts back and forth correctly for all days', () => {
			for (let dbDay = 0; dbDay <= 6; dbDay++) {
				const displayDay = dbDayToDisplayDay(dbDay);
				const backToDb = displayDayToDbDay(displayDay);
				expect(backToDb).toBe(dbDay);
			}
		});
	});
});

describe('calculateNextEpisode', () => {
	const mockAnime = {
		animeId: 'anime-1',
		seasons: [
			{
				animeSeasonId: 'season-1',
				animeId: 'anime-1',
				sequence: 1,
				episodes: 12
			},
			{
				animeSeasonId: 'season-2',
				animeId: 'anime-1',
				sequence: 2,
				episodes: 12
			}
		]
	};

	it('returns null when no anime is set', () => {
		const slot = {
			slot: {
				scheduleSlotId: 'slot-1',
				animeId: null,
				startingSequence: null,
				startingEpisode: null,
				episodeCount: 1,
				dayOfWeek: 1,
				isActive: true
			}
		};

		const result = calculateNextEpisode(slot, mockAnime.seasons, [slot]);
		expect(result).toBeNull();
	});

	it('calculates next episode for first slot of the week', () => {
		const slot = {
			slot: {
				scheduleSlotId: 'slot-1',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 1,
				episodeCount: 1,
				dayOfWeek: 1, // Monday
				isActive: true
			}
		};

		const result = calculateNextEpisode(slot, mockAnime.seasons, [slot]);
		expect(result).toEqual({ sequence: 1, episode: 1 });
	});

	it('calculates next episode for second slot of the week', () => {
		const slot1 = {
			slot: {
				scheduleSlotId: 'slot-1',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 1,
				episodeCount: 1,
				dayOfWeek: 1, // Monday
				isActive: true
			}
		};

		const slot2 = {
			slot: {
				scheduleSlotId: 'slot-2',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 1,
				episodeCount: 1,
				dayOfWeek: 2, // Tuesday
				isActive: true
			}
		};

		const result = calculateNextEpisode(slot2, mockAnime.seasons, [slot1, slot2]);
		expect(result).toEqual({ sequence: 1, episode: 2 });
	});

	it('handles multiple episodes per slot', () => {
		const slot1 = {
			slot: {
				scheduleSlotId: 'slot-1',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 1,
				episodeCount: 3,
				dayOfWeek: 1, // Monday
				isActive: true
			}
		};

		const slot2 = {
			slot: {
				scheduleSlotId: 'slot-2',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 1,
				episodeCount: 2,
				dayOfWeek: 2, // Tuesday
				isActive: true
			}
		};

		const result = calculateNextEpisode(slot2, mockAnime.seasons, [slot1, slot2]);
		expect(result).toEqual({ sequence: 1, episode: 4 }); // 1 + 3 episodes from slot1
	});

	it('advances to next season when episode count exceeds', () => {
		const slot1 = {
			slot: {
				scheduleSlotId: 'slot-1',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 10,
				episodeCount: 2,
				dayOfWeek: 1, // Monday
				isActive: true
			}
		};

		const slot2 = {
			slot: {
				scheduleSlotId: 'slot-2',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 10,
				episodeCount: 2,
				dayOfWeek: 2, // Tuesday
				isActive: true
			}
		};

		// slot1 shows E10, slot2 shows E12 (10 + 2 from slot1)
		// Both are still within S1 (which has 12 episodes)
		const result = calculateNextEpisode(slot2, mockAnime.seasons, [slot1, slot2]);
		expect(result).toEqual({ sequence: 1, episode: 12 });
	});

	it('properly overflows to next season', () => {
		const slot1 = {
			slot: {
				scheduleSlotId: 'slot-1',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 11,
				episodeCount: 2,
				dayOfWeek: 1, // Monday
				isActive: true
			}
		};

		const slot2 = {
			slot: {
				scheduleSlotId: 'slot-2',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 11,
				episodeCount: 2,
				dayOfWeek: 2, // Tuesday
				isActive: true
			}
		};

		// slot1 shows E11-12, slot2 shows S2 E1 (11 + 2 = 13, overflow to S2)
		const result = calculateNextEpisode(slot2, mockAnime.seasons, [slot1, slot2]);
		expect(result).toEqual({ sequence: 2, episode: 1 });
	});

	it('caps at last episode when no next season exists', () => {
		const limitedSeasons = [
			{
				animeSeasonId: 'season-1',
				animeId: 'anime-1',
				sequence: 1,
				episodes: 12
			}
		];

		const slot1 = {
			slot: {
				scheduleSlotId: 'slot-1',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 11,
				episodeCount: 1,
				dayOfWeek: 1,
				isActive: true
			}
		};

		const slot2 = {
			slot: {
				scheduleSlotId: 'slot-2',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 11,
				episodeCount: 1,
				dayOfWeek: 2,
				isActive: true
			}
		};

		const slot3 = {
			slot: {
				scheduleSlotId: 'slot-3',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 11,
				episodeCount: 1,
				dayOfWeek: 3,
				isActive: true
			}
		};

		// slot1: E11, slot2: E12, slot3: should cap at E12 (no S2)
		const result = calculateNextEpisode(slot3, limitedSeasons, [slot1, slot2, slot3]);
		expect(result).toEqual({ sequence: 1, episode: 12 });
	});

	it('ignores inactive slots', () => {
		const slot1 = {
			slot: {
				scheduleSlotId: 'slot-1',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 1,
				episodeCount: 1,
				dayOfWeek: 1,
				isActive: false // Inactive
			}
		};

		const slot2 = {
			slot: {
				scheduleSlotId: 'slot-2',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 1,
				episodeCount: 1,
				dayOfWeek: 2,
				isActive: true
			}
		};

		// slot1 is inactive, so slot2 should show E1
		const result = calculateNextEpisode(slot2, mockAnime.seasons, [slot1, slot2]);
		expect(result).toEqual({ sequence: 1, episode: 1 });
	});

	it('handles seasons without episode count (null)', () => {
		const unlimitedSeasons = [
			{
				animeSeasonId: 'season-1',
				animeId: 'anime-1',
				sequence: 1,
				episodes: null // No limit
			}
		];

		const slot1 = {
			slot: {
				scheduleSlotId: 'slot-1',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 100,
				episodeCount: 5,
				dayOfWeek: 1,
				isActive: true
			}
		};

		const slot2 = {
			slot: {
				scheduleSlotId: 'slot-2',
				animeId: 'anime-1',
				startingSequence: 1,
				startingEpisode: 100,
				episodeCount: 3,
				dayOfWeek: 2,
				isActive: true
			}
		};

		// Should just add episodes without season boundary checks
		const result = calculateNextEpisode(slot2, unlimitedSeasons, [slot1, slot2]);
		expect(result).toEqual({ sequence: 1, episode: 105 }); // 100 + 5 from slot1
	});
});
