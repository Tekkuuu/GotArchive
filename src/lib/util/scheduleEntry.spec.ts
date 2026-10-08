import { describe, it, expect } from 'vitest';
import type { AnimeSeason } from '$lib/server/db';
import {
	uniqueAnime,
	filteredSeasons,
	addSeasonSelection,
	removeSeasonSelection,
	getSeasonInfo,
	formatTime
} from './scheduleEntry';

function season(overrides: Partial<AnimeSeason> = {}): AnimeSeason {
	return {
		animeSeasonId: 'season-1',
		animeId: 'anime-1',
		sequence: 1,
		format: 'TV',
		titleNative: 'ネイティブ',
		titleRomaji: null,
		titleEnglish: null,
		shortTitle: null,
		season: null,
		year: null,
		episodes: null,
		episodeProgress: 0,
		skippedEpisodes: null,
		anilistId: null,
		malId: null,
		note: null,
		...overrides
	} as AnimeSeason;
}

describe('uniqueAnime', () => {
	it('returns [] for undefined', () => {
		expect(uniqueAnime(undefined)).toEqual([]);
	});

	it('de-duplicates by animeId and sorts by title', () => {
		const result = uniqueAnime([
			season({ animeSeasonId: 's1', animeId: 'a2', titleNative: 'Zeta' }),
			season({ animeSeasonId: 's2', animeId: 'a1', titleEnglish: 'Alpha' }),
			season({ animeSeasonId: 's3', animeId: 'a2', titleNative: 'Zeta' })
		]);

		expect(result).toEqual([
			{ animeId: 'a1', title: 'Alpha' },
			{ animeId: 'a2', title: 'Zeta' }
		]);
	});

	it('falls back through title fields to Unknown', () => {
		const result = uniqueAnime([season({ animeId: 'a1', titleNative: '' })]);
		expect(result[0].title).toBe('Unknown');
	});
});

describe('filteredSeasons', () => {
	it('returns [] when nothing is selected', () => {
		expect(filteredSeasons([season()], null)).toEqual([]);
	});

	it('returns [] for undefined seasons', () => {
		expect(filteredSeasons(undefined, 'anime-1')).toEqual([]);
	});

	it('filters by animeId', () => {
		const seasons = [
			season({ animeSeasonId: 's1', animeId: 'a1' }),
			season({ animeSeasonId: 's2', animeId: 'a2' })
		];
		expect(filteredSeasons(seasons, 'a2')).toEqual([seasons[1]]);
	});
});

describe('season selection helpers', () => {
	it('adds a season with default episode "1"', () => {
		expect(addSeasonSelection([], 's1')).toEqual([{ animeSeasonId: 's1', episodes: '1' }]);
	});

	it('does not add duplicates', () => {
		const current = [{ animeSeasonId: 's1', episodes: '3' }];
		expect(addSeasonSelection(current, 's1')).toBe(current);
	});

	it('removes by season id', () => {
		const current = [
			{ animeSeasonId: 's1', episodes: '1' },
			{ animeSeasonId: 's2', episodes: '2' }
		];
		expect(removeSeasonSelection(current, 's1')).toEqual([{ animeSeasonId: 's2', episodes: '2' }]);
	});

	it('looks up season metadata', () => {
		const s = season({ animeSeasonId: 's1' });
		expect(getSeasonInfo([s], 's1')).toBe(s);
		expect(getSeasonInfo([s], 'nope')).toBeUndefined();
	});
});

describe('formatTime', () => {
	it('formats a time string to HH:mm', () => {
		expect(formatTime('12:34:00')).toBe('12:34');
	});

	it('uses "No time" for null by default', () => {
		expect(formatTime(null)).toBe('No time');
		expect(formatTime('')).toBe('No time');
	});

	it('honours a custom empty value', () => {
		expect(formatTime(null, { empty: 'Unknown time' })).toBe('Unknown time');
	});

	it('treats the input as UTC when requested', () => {
		const utc = formatTime('12:00:00', { utc: true });
		// Matches a Date built from the same UTC instant, formatted locally.
		const expected = new Date('1970-01-01T12:00:00Z');
		expect(utc).toBe(
			`${String(expected.getHours()).padStart(2, '0')}:${String(expected.getMinutes()).padStart(2, '0')}`
		);
	});
});
