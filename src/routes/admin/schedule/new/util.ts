import { z } from 'zod';

export const ScheduleDataSchema = z.object({
	year: z.number().int().min(1900).max(2100, 'Year must be between 1900 and 2100'),
	week: z.number().int().min(1).max(53, 'Week must be between 1 and 53'),
	note: z.string().max(1000, 'Note must be less than 1000 characters long').optional(),
	preview: z.boolean().default(true)
});

export const ScheduleEntryAnimeSeasonSchema = z.object({
	animeSeasonId: z.uuid(),
	// Support formats: "1", "1-4", "1,3,5", "1-4,6,8-10"
	episodes: z
		.string()
		.regex(
			/^(\d+(-\d+)?)(\s*,\s*\d+(-\d+)?)*$/,
			'Episodes must be in format: "1", "1-4", "1,3,5", or "1-4,6,8-10"'
		)
});

export const ScheduleEntrySchema = z.object({
	type: z.enum(['anime', 'hololive', 'game', 'event', 'sponsored', 'misc']).default('misc'),
	date: z.string(),
	time: z.string().nullable(),
	note: z.string().max(1000, 'Note must be less than 1000 characters long').nullable(),
	logoUrl: z.url().nullable(),
	title: z.string().nullable(),
	description: z
		.string()
		.max(1000, 'Description must be less than 1000 characters long')
		.nullable(),
	cancelledText: z
		.string()
		.max(1000, 'Cancelled text must be less than 1000 characters long')
		.nullable(),
	isCancelled: z.boolean().default(false),
	anime: z.array(ScheduleEntryAnimeSeasonSchema).nullable(),
	platforms: z.array(z.uuid()).nullable(),
	// Helper fields for UI
	slotId: z.uuid().nullable() // Reference to the slot this entry was generated from
});

export const ScheduleSchema = z.object({
	schedule: ScheduleDataSchema,
	entries: z.array(ScheduleEntrySchema)
});
