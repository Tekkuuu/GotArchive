import { z } from 'zod/v4';

export const formatEnum = z.enum(['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']);
export const seasonEnum = z.enum(['WINTER', 'SPRING', 'SUMMER', 'FALL']);
export const entryTypeEnum = z.enum(['anime', 'hololive', 'game', 'event', 'sponsored', 'misc']);

export type Format = z.infer<typeof formatEnum>;
export type Season = z.infer<typeof seasonEnum>;
export type EntryType = z.infer<typeof entryTypeEnum>;

export const WEEKDAYS = [
	{ value: 0, label: 'Monday' },
	{ value: 1, label: 'Tuesday' },
	{ value: 2, label: 'Wednesday' },
	{ value: 3, label: 'Thursday' },
	{ value: 4, label: 'Friday' },
	{ value: 5, label: 'Saturday' },
	{ value: 6, label: 'Sunday' }
] as const;

/** Monday-first labels. */
export const DAY_NAMES = WEEKDAYS.map((day) => day.label);

/** ISO day indices. */
export const ALL_WEEKDAYS = WEEKDAYS.map((day) => day.value);

export const SCHEDULE_ENTRY_TYPES = [
	{ value: 'anime', label: 'Anime' },
	{ value: 'hololive', label: 'Hololive' },
	{ value: 'game', label: 'Game' },
	{ value: 'event', label: 'Event' },
	{ value: 'sponsored', label: 'Sponsored' },
	{ value: 'misc', label: 'Misc' }
] as const;

/** Badge class per type. */
export const ENTRY_TYPE_BADGE: Record<string, string> = {
	anime: 'badge-primary',
	hololive: 'badge-secondary',
	game: 'badge-accent',
	event: 'badge-info',
	sponsored: 'badge-warning',
	misc: 'badge-ghost'
};

/** Hex colour per type. */
export const ENTRY_TYPE_COLOR: Record<string, string> = {
	anime: '#3b82f6',
	hololive: '#60a5fa',
	game: '#8b5cf6',
	event: '#ec4899',
	sponsored: '#f59e0b',
	misc: '#6b7280'
};

/**
 * Badge class for type.
 * @param type - Entry type.
 * @returns Class.
 */
export function entryTypeBadge(type: string): string {
	return ENTRY_TYPE_BADGE[type] ?? ENTRY_TYPE_BADGE.misc;
}

/**
 * Hex colour for type.
 * @param type - Entry type.
 * @returns Colour.
 */
export function entryTypeColor(type: string): string {
	return ENTRY_TYPE_COLOR[type] ?? ENTRY_TYPE_COLOR.misc;
}
