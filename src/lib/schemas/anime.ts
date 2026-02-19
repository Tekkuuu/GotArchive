import { z } from 'zod/v4';
import { formatEnum, seasonEnum } from './common';

const link = z.object({
	url: z.url(),
	platformId: z.uuid(),
	note: z.string().nullable()
});

const genre = z.object({
	genreId: z.uuid(),
	name: z.string().min(1)
});

export const NewAnimeFormSchema = z.object({
	titleNative: z.string().min(1),
	titleRomaji: z.string().min(1).nullable(),
	titleEnglish: z.string().min(1).nullable(),
	shortTitle: z.string().min(1).nullable(),
	logoUrl: z.url().nullable(),
	genres: z.array(genre),
	links: z.array(link)
});

export const NewSeasonFormSchema = z.object({
	animeId: z.uuid(),
	sequence: z.number().int().positive(),
	format: formatEnum,
	titleNative: z.string().min(1),
	titleRomaji: z.string().min(1).nullable(),
	titleEnglish: z.string().min(1).nullable(),
	shortTitle: z.string().min(1).nullable(),
	season: seasonEnum.nullable(),
	year: z.number().int().min(1900).nullable(),
	episodes: z.number().int().positive().nullable(),
	anilistId: z.number().int().positive().nullable(),
	malId: z.number().int().positive().nullable(),
	note: z.string().nullable()
});

export const AnimeUpdateFormSchema = z.object({
	animeId: z.uuid(),
	titleNative: z.string().nullable(),
	titleRomaji: z.string().nullable(),
	titleEnglish: z.string().nullable(),
	logoUrl: z.string().nullable(),
	shortTitle: z.string().nullable()
});
