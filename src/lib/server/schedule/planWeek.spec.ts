import { describe, it, expect } from 'vitest';
import { addDays, format } from 'date-fns';
import { planWeek, type PlanSeason, type PlanSlot, type PreviousProgress } from './planWeek';

const weekStart = new Date('2026-01-05T00:00:00Z'); // a Monday

function slot(overrides: Partial<PlanSlot> = {}): PlanSlot {
	return {
		slotId: 'slot-1',
		dayOfWeek: 0,
		time: null,
		type: 'anime',
		animeId: 'anime-1',
		title: null,
		description: null,
		logoUrl: null,
		episodeCount: 1,
		cancelledText: null,
		note: null,
		platforms: [],
		...overrides
	};
}

function season(overrides: Partial<PlanSeason> = {}): PlanSeason {
	return {
		animeSeasonId: 'season-1',
		animeId: 'anime-1',
		sequence: 1,
		episodes: 12,
		episodeProgress: 0,
		...overrides
	};
}

function progress(entries: Record<string, PreviousProgress>): Map<string, PreviousProgress> {
	return new Map(Object.entries(entries));
}

describe('planWeek', () => {
	it('bootstraps from episodeProgress + 1 when there is no history', () => {
		const entries = planWeek([slot()], [season({ episodeProgress: 5 })], progress({}), weekStart);

		expect(entries).toHaveLength(1);
		expect(entries[0].anime).toEqual([{ animeSeasonId: 'season-1', episodes: '6' }]);
		expect(entries[0].type).toBe('anime');
	});

	it('continues from the previous progress', () => {
		const entries = planWeek(
			[slot()],
			[season()],
			progress({ 'anime-1': { sequence: 1, episode: 5 } }),
			weekStart
		);

		expect(entries[0].anime).toEqual([{ animeSeasonId: 'season-1', episodes: '5' }]);
	});

	it('emits a range for multi-episode streams', () => {
		const entries = planWeek(
			[slot({ episodeCount: 3 })],
			[season()],
			progress({ 'anime-1': { sequence: 1, episode: 4 } }),
			weekStart
		);

		expect(entries[0].anime).toEqual([{ animeSeasonId: 'season-1', episodes: '4-6' }]);
	});

	it('rolls over into the next season mid-stream', () => {
		const entries = planWeek(
			[slot({ episodeCount: 3 })],
			[
				season({ animeSeasonId: 'season-1', sequence: 1, episodes: 2 }),
				season({ animeSeasonId: 'season-2', sequence: 2, episodes: 5 })
			],
			progress({ 'anime-1': { sequence: 1, episode: 2 } }),
			weekStart
		);

		expect(entries[0].anime).toEqual([
			{ animeSeasonId: 'season-1', episodes: '2' },
			{ animeSeasonId: 'season-2', episodes: '1-2' }
		]);
	});

	it('skips an anime whose next episode is past the season end', () => {
		const entries = planWeek(
			[slot()],
			[season({ episodes: 12 })],
			progress({ 'anime-1': { sequence: 1, episode: 13 } }),
			weekStart
		);

		expect(entries).toHaveLength(0);
	});

	it('handles non-anime slots', () => {
		const entries = planWeek(
			[slot({ type: 'misc', animeId: null, title: 'Movie Night' })],
			[],
			progress({}),
			weekStart
		);

		expect(entries).toHaveLength(1);
		expect(entries[0]).toMatchObject({ type: 'misc', anime: null, title: 'Movie Night' });
	});

	it('copies cancellation text but does not generate cancelled entries', () => {
		const entries = planWeek(
			[slot({ cancelledText: 'Cancelled this week' })],
			[season()],
			progress({}),
			weekStart
		);

		expect(entries[0].cancelledText).toBe('Cancelled this week');
		expect(entries[0].isCancelled).toBe(false);
	});

	it('sorts slots by day of week, then time, and dates them from weekStart', () => {
		const entries = planWeek(
			[
				slot({ slotId: 'wed', dayOfWeek: 2, time: '10:00' }),
				slot({ slotId: 'mon-late', dayOfWeek: 0, time: '20:00' }),
				slot({ slotId: 'mon-early', dayOfWeek: 0, time: '08:00' })
			],
			[season()],
			progress({}),
			weekStart
		);

		expect(entries.map((e) => e.slotId)).toEqual(['mon-early', 'mon-late', 'wed']);
		expect(entries[0].date).toBe(format(addDays(weekStart, 0), 'yyyy-MM-dd'));
		expect(entries[2].date).toBe(format(addDays(weekStart, 2), 'yyyy-MM-dd'));
	});

	it('continues a second occurrence of the same anime from the running progress', () => {
		const entries = planWeek(
			[slot({ slotId: 'a', dayOfWeek: 0 }), slot({ slotId: 'b', dayOfWeek: 1 })],
			[season()],
			progress({ 'anime-1': { sequence: 1, episode: 5 } }),
			weekStart
		);

		expect(entries[0].anime).toEqual([{ animeSeasonId: 'season-1', episodes: '5' }]);
		expect(entries[1].anime).toEqual([{ animeSeasonId: 'season-1', episodes: '6' }]);
	});
});
