import { describe, it, expect } from 'vitest';
import { parseDurationString, computeWatchedAfterDate, computeDurationStringFromWatchedAfter } from '../../../src/lib/util/schedule';

// parseDurationString tests
describe('parseDurationString', () => {
  it('parses hours, minutes, seconds', () => {
    expect(parseDurationString('1h30m15s')).toEqual({ hours: 1, minutes: 30, seconds: 15 });
    expect(parseDurationString('45m')).toEqual({ hours: 0, minutes: 45, seconds: 0 });
    expect(parseDurationString('2h')).toEqual({ hours: 2, minutes: 0, seconds: 0 });
    expect(parseDurationString('10s')).toEqual({ hours: 0, minutes: 0, seconds: 10 });
  });

  it('returns null for empty or invalid string', () => {
    expect(parseDurationString('')).toBeNull();
    expect(parseDurationString('abc')).toBeNull();
    expect(parseDurationString(null as any)).toBeNull();
    expect(parseDurationString(undefined as any)).toBeNull();
  });
});

// computeWatchedAfterDate tests
describe('computeWatchedAfterDate', () => {
  it('returns undefined if date is missing or invalid', () => {
    expect(computeWatchedAfterDate(undefined, undefined, '1h')).toBeUndefined();
    expect(computeWatchedAfterDate(null, null, '1h')).toBeUndefined();
    expect(computeWatchedAfterDate('invalid-date', null, '1h')).toBeUndefined();
  });

  it('returns date+1day@00:00 if duration is empty or invalid', () => {
    const result = computeWatchedAfterDate('2025-08-18', null, '');
    expect(result?.toISOString()).toBe('2025-08-19T00:00:00.000Z');
    const result2 = computeWatchedAfterDate('2025-08-18', '', null as any);
    expect(result2?.toISOString()).toBe('2025-08-19T00:00:00.000Z');
  });

  it('returns date+1day@00:00 if date & time but no duration', () => {
    const result = computeWatchedAfterDate('2025-08-18', '12:00', '');
    expect(result?.toISOString()).toBe('2025-08-19T00:00:00.000Z');
  });

  it('returns (date+time)+duration if all provided', () => {
    const result = computeWatchedAfterDate('2025-08-18', '12:00', '1h30m');
    // 2025-08-18T12:00:00 + 1h30m = 2025-08-18T13:30:00
    expect(result?.toISOString()).toBe('2025-08-18T13:30:00.000Z');
  });

  it('returns (date+1day@00:00) if time is missing but duration is valid', () => {
    const result = computeWatchedAfterDate('2025-08-18', null, '2h');
    expect(result?.toISOString()).toBe('2025-08-19T00:00:00.000Z');
  });
});

// computeDurationStringFromWatchedAfter tests
describe('computeDurationStringFromWatchedAfter', () => {
  it('returns undefined if date or watchedAfter is missing or invalid', () => {
    expect(computeDurationStringFromWatchedAfter(undefined, undefined, new Date())).toBeUndefined();
    expect(computeDurationStringFromWatchedAfter(null, null, new Date())).toBeUndefined();
    expect(computeDurationStringFromWatchedAfter('invalid-date', null, new Date())).toBeUndefined();
    expect(computeDurationStringFromWatchedAfter('2025-08-18', null, undefined)).toBeUndefined();
    expect(computeDurationStringFromWatchedAfter('2025-08-18', null, null)).toBeUndefined();
  });

  it('returns undefined if watchedAfter is before base date+time', () => {
    // Base is 2025-08-18T12:00:00Z, watchedAfter is before
    expect(computeDurationStringFromWatchedAfter('2025-08-18', '12:00', new Date('2025-08-18T11:00:00Z'))).toBeUndefined();
  });

  it('returns "0s" for zero duration', () => {
    expect(computeDurationStringFromWatchedAfter('2025-08-18', '12:00', new Date('2025-08-18T12:00:00Z'))).toBe('0s');
    expect(computeDurationStringFromWatchedAfter('2025-08-18', '', new Date('2025-08-19T00:00:00Z'))).toBe('0s');
  });

  it('returns correct duration string for date+time', () => {
    expect(
      computeDurationStringFromWatchedAfter('2025-08-18', '12:00', new Date('2025-08-18T13:30:10Z'))
    ).toBe('1h30m10s');
    expect(
      computeDurationStringFromWatchedAfter('2025-08-18', '12:00', new Date('2025-08-18T12:45:00Z'))
    ).toBe('45m');
    expect(
      computeDurationStringFromWatchedAfter('2025-08-18', '12:00', new Date('2025-08-18T12:00:30Z'))
    ).toBe('30s');
    expect(
      computeDurationStringFromWatchedAfter('2025-08-18', '12:00', new Date('2025-08-18T14:00:00Z'))
    ).toBe('2h');
  });

  it('returns correct duration string for multiple days when time is given', () => {
    // 2025-08-14T13:00:00Z to 2025-08-17T13:00:00Z is exactly 72h
    expect(
      computeDurationStringFromWatchedAfter('2025-08-14', '13:00', new Date('2025-08-17T13:00:00Z'))
    ).toBe('72h');
    // 2025-08-14T09:00:00Z to 2025-08-18T10:30:00Z is 97h30m
    expect(
      computeDurationStringFromWatchedAfter('2025-08-14', '09:00', new Date('2025-08-18T10:30:00Z'))
    ).toBe('97h30m');
  });

  it('accepts time with seconds', () => {
    expect(
      computeDurationStringFromWatchedAfter('2025-08-18', '12:00:15', new Date('2025-08-18T13:01:15Z'))
    ).toBe('1h1m');
  });

  it('accepts watchedAfter as a string', () => {
    expect(
      computeDurationStringFromWatchedAfter('2025-08-18', '12:00', '2025-08-18T13:30:10Z')
    ).toBe('1h30m10s');
  });
});
