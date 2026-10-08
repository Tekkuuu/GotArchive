import { describe, it, expect } from 'vitest';
import { getAnimeTitle } from './animeTitle';

describe('getAnimeTitle', () => {
	it('prefers English, then Romaji, then Native', () => {
		expect(getAnimeTitle({ titleEnglish: 'En', titleRomaji: 'Ro', titleNative: 'Na' })).toBe('En');
		expect(getAnimeTitle({ titleEnglish: null, titleRomaji: 'Ro', titleNative: 'Na' })).toBe('Ro');
		expect(getAnimeTitle({ titleEnglish: null, titleRomaji: null, titleNative: 'Na' })).toBe('Na');
	});

	it('falls back to the provided fallback (default empty string)', () => {
		expect(getAnimeTitle({ titleEnglish: null, titleRomaji: null, titleNative: null })).toBe('');
		expect(
			getAnimeTitle({ titleEnglish: null, titleRomaji: null, titleNative: null }, 'Untitled')
		).toBe('Untitled');
	});
});
