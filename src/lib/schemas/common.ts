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

export const SCHEDULE_ENTRY_TYPES = [
	{ value: 'anime', label: 'Anime' },
	{ value: 'hololive', label: 'Hololive' },
	{ value: 'game', label: 'Game' },
	{ value: 'event', label: 'Event' },
	{ value: 'sponsored', label: 'Sponsored' },
	{ value: 'misc', label: 'Misc' }
] as const;
