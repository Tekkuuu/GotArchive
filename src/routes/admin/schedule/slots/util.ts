import { z } from 'zod/v4';

const platform = z.object({
	platformId: z.uuid()
});

const animeSeason = z.object({
	animeSeasonId: z.uuid(),
	animeId: z.uuid(),
	sequence: z.number().int(),
	titleNative: z.string(),
	titleRomaji: z.string().nullable(),
	titleEnglish: z.string().nullable()
});

export const formSchema = z.object({
	dayOfWeek: z.number().int().min(0).max(6),
	time: z.string().min(1).nullable(),
	type: z.enum(['anime', 'hololive', 'game', 'event', 'sponsored', 'misc']).nullable(),
	animeId: z.uuid().nullable(), // Will be set from selected anime season
	startingSequence: z.number().int().positive().nullable(), // Season sequence number
	startingEpisode: z.number().int().positive().nullable(),
	title: z.string().min(1).nullable(),
	description: z.string().nullable(),
	logoUrl: z.string().url().nullable(),
	episodeCount: z.number().int().positive().nullable(),
	cancelledText: z.string().nullable(),
	note: z.string().nullable(),
	isActive: z.boolean().default(true),
	platforms: z.array(platform).default([]),
	// For bulk duplication
	duplicateToDays: z.array(z.number().int().min(0).max(6)).default([]),
	// Helper field for UI - not in database
	animeSeasonId: z.uuid().nullable()
});

export const DAY_NAMES = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
] as const;

export const SCHEDULE_ENTRY_TYPES = [
	{ value: 'anime', label: 'Anime' },
	{ value: 'hololive', label: 'Hololive' },
	{ value: 'game', label: 'Game' },
	{ value: 'event', label: 'Event' },
	{ value: 'sponsored', label: 'Sponsored' },
	{ value: 'misc', label: 'Misc' }
] as const;
