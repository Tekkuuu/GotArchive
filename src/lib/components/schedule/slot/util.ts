import { z } from 'zod';

const platform = z.object({
	platformId: z.uuid()
});

export const AddScheduleSlotSchema = z.object({
	dayOfWeek: z.number().int().min(0).max(6),
	time: z.string().min(1).nullable(),
	type: z.enum(['anime', 'hololive', 'game', 'event', 'sponsored', 'misc']).nullable(),
	animeId: z.uuid().nullable(), // Will be set from selected anime season
	startingSequence: z.number().int().positive().nullable(), // Season sequence number
	startingEpisode: z.number().int().positive().nullable(),
	title: z.string().min(1).nullable(),
	description: z.string().nullable(),
	logoUrl: z.url().nullable(),
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

export const EditScheduleSlotSchema = AddScheduleSlotSchema.omit({
	type: true,
	duplicateToDays: true,
	animeSeasonId: true,
	startingSequence: true,
	startingEpisode: true,
	isActive: true,
	animeId: true
});

export const SCHEDULE_ENTRY_TYPES = [
	{ value: 'anime', label: 'Anime' },
	{ value: 'hololive', label: 'Hololive' },
	{ value: 'game', label: 'Game' },
	{ value: 'event', label: 'Event' },
	{ value: 'sponsored', label: 'Sponsored' },
	{ value: 'misc', label: 'Misc' }
] as const;

export const WEEKDAYS = [
	{ value: 0, label: 'Monday' },
	{ value: 1, label: 'Tuesday' },
	{ value: 2, label: 'Wednesday' },
	{ value: 3, label: 'Thursday' },
	{ value: 4, label: 'Friday' },
	{ value: 5, label: 'Saturday' },
	{ value: 6, label: 'Sunday' }
];
