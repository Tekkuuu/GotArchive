import { z } from 'zod/v4';
import { entryTypeEnum } from './common';

export const ScheduleDataSchema = z.object({
	year: z.number().int().min(1900).max(2100, 'Year must be between 1900 and 2100'),
	week: z.number().int().min(1).max(53, 'Week must be between 1 and 53'),
	note: z.string().max(1000, 'Note must be less than 1000 characters long').nullable(),
	preview: z.boolean().default(true)
});

export const EditScheduleSchema = ScheduleDataSchema.omit({
	year: true,
	week: true
}).extend({
	scheduleId: z.uuid()
});

export const ValidateDateSchema = ScheduleDataSchema.pick({ year: true, week: true });

export const ScheduleEntryAnimeSeasonSchema = z.object({
	animeSeasonId: z.uuid(),
	episodes: z
		.string()
		.regex(
			/^(\d+(-\d+)?)(\s*,\s*\d+(-\d+)?)*$/,
			'Episodes must be in format: "1", "1-4", "1,3,5", or "1-4,6,8-10"'
		)
});

export const ScheduleEntrySchema = z.object({
	type: entryTypeEnum.default('misc'),
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
	slotId: z.uuid().nullable()
});

export const ScheduleSchema = z.object({
	schedule: ScheduleDataSchema,
	entries: z.array(ScheduleEntrySchema),
	slotsToReset: z.array(z.uuid()).default([])
});

const platform = z.object({
	platformId: z.uuid()
});

export const AddScheduleSlotSchema = z.object({
	dayOfWeek: z.number().int().min(0).max(6),
	time: z.string().min(1).nullable(),
	type: entryTypeEnum.nullable(),
	animeId: z.uuid().nullable(),
	startingSequence: z.number().int().positive().nullable().default(null),
	startingEpisode: z.number().int().positive().nullable().default(null),
	title: z.string().min(1).nullable(),
	description: z.string().nullable(),
	logoUrl: z.url().nullable(),
	episodeCount: z.number().int().positive().nullable(),
	cancelledText: z.string().nullable(),
	note: z.string().nullable(),
	isActive: z.boolean().default(true),
	platforms: z.array(platform).default([]),
	duplicateToDays: z.array(z.number().int().min(0).max(6)).default([])
});

export const EditScheduleSlotSchema = AddScheduleSlotSchema.omit({
	type: true,
	duplicateToDays: true,
	isActive: true,
	animeId: true
});

export const AddScheduleEntrySchema = ScheduleEntrySchema;

export const EditScheduleEntrySchema = ScheduleEntrySchema.omit({
	type: true,
	date: true,
	slotId: true
}).extend({
	scheduleEntryId: z.uuid()
});

export const ToggleCancelledSchema = z.object({
	scheduleEntryId: z.uuid(),
	isCancelled: z.boolean()
});

export const DeleteScheduleSchema = z.object({
	scheduleId: z.uuid()
});

export const TogglePreviewSchema = z.object({
	scheduleId: z.uuid(),
	preview: z.boolean()
});
