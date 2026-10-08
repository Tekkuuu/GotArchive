import { describe, it, expect } from 'vitest';
import {
	applyTimezone,
	parseTzParam,
	tzLabel,
	tzAbbreviation,
	resolveDisplayZone
} from './timezone';
import type { ScheduleEntryData } from './datecode/types';

function entry(overrides: Partial<ScheduleEntryData> = {}): ScheduleEntryData {
	return {
		scheduleEntryId: 'e1',
		date: '2026-01-05',
		dayOfWeek: 0,
		time: '12:00:00',
		type: 'anime',
		title: null,
		description: null,
		logoUrl: null,
		note: null,
		isCancelled: false,
		cancelledText: null,
		animeSeasons: [],
		platforms: [],
		...overrides
	};
}

describe('parseTzParam', () => {
	it('defaults to UTC when absent', () => {
		expect(parseTzParam(null)).toBe('UTC');
	});

	it('accepts IANA zones', () => {
		expect(parseTzParam('Europe/London')).toBe('Europe/London');
	});

	it('rejects abbreviations and garbage', () => {
		expect(parseTzParam('BST')).toBeNull();
		expect(parseTzParam('not-a-zone')).toBeNull();
	});
});

describe('tzLabel', () => {
	it('defaults to UTC when absent', () => {
		expect(tzLabel(null)).toBe('UTC');
	});

	it('returns null for invalid zones', () => {
		expect(tzLabel('BST')).toBeNull();
	});
});

describe('tzAbbreviation', () => {
	it('returns BST for London in summer, GMT in winter', () => {
		expect(tzAbbreviation('Europe/London', new Date('2026-07-06T12:00:00Z'))).toBe('BST');
		expect(tzAbbreviation('Europe/London', new Date('2026-01-05T12:00:00Z'))).toBe('GMT');
	});

	it('returns EDT/EST for New York', () => {
		expect(tzAbbreviation('America/New_York', new Date('2026-07-06T12:00:00Z'))).toBe('EDT');
		expect(tzAbbreviation('America/New_York', new Date('2026-01-05T12:00:00Z'))).toBe('EST');
	});

	it('handles southern-hemisphere DST (Sydney)', () => {
		expect(tzAbbreviation('Australia/Sydney', new Date('2026-01-05T12:00:00Z'))).toBe('AEDT');
		expect(tzAbbreviation('Australia/Sydney', new Date('2026-07-06T12:00:00Z'))).toBe('AEST');
	});

	it('returns the fixed name for zones without DST', () => {
		expect(tzAbbreviation('Asia/Tokyo', new Date('2026-07-06T12:00:00Z'))).toBe('JST');
		expect(tzAbbreviation('UTC', new Date('2026-01-05T12:00:00Z'))).toBe('UTC');
	});

	it('returns null for invalid zones', () => {
		expect(tzAbbreviation('not-a-zone')).toBeNull();
	});
});

describe('resolveDisplayZone', () => {
	it('prefers the explicit param', () => {
		expect(resolveDisplayZone('Europe/Warsaw', 'America/New_York')).toBe('Europe/Warsaw');
	});

	it('falls back to the viewer zone', () => {
		expect(resolveDisplayZone(null, 'America/New_York')).toBe('America/New_York');
	});

	it('falls back to UTC with neither', () => {
		expect(resolveDisplayZone(null, null)).toBe('UTC');
	});

	it('falls back to UTC on an invalid param', () => {
		expect(resolveDisplayZone('BST', 'America/New_York')).toBe('UTC');
	});
});

describe('applyTimezone', () => {
	it('returns entries without a time unchanged (adjustedTime null)', () => {
		const result = applyTimezone(entry({ time: null }), 'UTC');
		expect(result.adjustedTime).toBeNull();
		expect(result.date).toBe('2026-01-05');
		expect(result.time).toBeNull();
	});

	it('keeps UTC wall time in UTC', () => {
		const result = applyTimezone(entry({ time: '12:00:00' }), 'UTC');
		expect(result.adjustedTime).toBe('12:00:00');
		expect(result.time).toBe('12:00:00');
	});

	it('shifts a winter UTC time for Europe/Helsinki (+2 EET in January)', () => {
		const result = applyTimezone(entry({ time: '12:00:00' }), 'Europe/Helsinki');
		expect(result.adjustedTime).toBe('14:00:00');
		expect(result.time).toBe('14:00:00');
	});

	it('rolls the date forward when the shift crosses midnight', () => {
		const result = applyTimezone(
			entry({ date: '2026-01-05', time: '23:30:00' }),
			'Europe/Helsinki'
		);
		expect(result.date).toBe('2026-01-06');
		expect(result.dayOfWeek).toBe(1);
	});

	it('returns the entry unshifted for a malformed time', () => {
		const result = applyTimezone(entry({ time: 'not-a-time' }), 'UTC');
		expect(result.adjustedTime).toBeNull();
		expect(result.time).toBe('not-a-time');
	});

	it('returns the entry unshifted for a malformed date', () => {
		const result = applyTimezone(entry({ date: 'invalid' }), 'UTC');
		expect(result.adjustedTime).toBeNull();
		expect(result.date).toBe('invalid');
	});
});
