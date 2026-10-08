import { describe, it, expect } from 'vitest';
import { formatIsoWeekLine } from './dateUtils';

describe('formatIsoWeekLine', () => {
	it('formats a week within one month', () => {
		expect(formatIsoWeekLine(2026, 41)).toBe('5-11 October 2026, week 41');
	});

	it('formats a week spanning two months', () => {
		expect(formatIsoWeekLine(2025, 40)).toBe('29 September - 5 October 2025, week 40');
	});

	it('formats a week spanning two years', () => {
		expect(formatIsoWeekLine(2025, 1)).toBe('30 December 2024 - 5 January 2025, week 1');
	});
});
