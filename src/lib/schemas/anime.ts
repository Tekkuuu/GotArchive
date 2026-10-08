import { z } from 'zod/v4';
import { formatEnum, seasonEnum } from './common';

// Remote form schemas have a strict input contract: every field must be
// `string | number | boolean | File | undefined` (or a nested object/array of
// those). That rules out `.nullable()` and `.transform()` on inputs, so optional
// fields are `.optional()` and the empty values (`''` from text/select, undefined
// from an empty number input) are normalised to `null` in the remote handlers.

const optionalText = z.string().optional();
const optionalUrl = z.union([z.literal(''), z.url()]).optional();
const optionalSeason = z.union([seasonEnum, z.literal('')]).optional();

const link = z.object({
	url: z.url(),
	platformId: z.uuid(),
	note: z.string().optional()
});

const genre = z.object({
	genreId: z.uuid(),
	name: z.string().min(1)
});

export const NewAnimeFormSchema = z.object({
	titleNative: z.string().min(1),
	titleRomaji: optionalText,
	titleEnglish: optionalText,
	shortTitle: optionalText,
	logoUrl: optionalUrl,
	genres: z.array(genre).default([]),
	links: z.array(link).default([])
});

export const NewSeasonFormSchema = z.object({
	animeId: z.uuid(),
	sequence: z.number().int().positive(),
	format: formatEnum,
	titleNative: z.string().min(1),
	titleRomaji: optionalText,
	titleEnglish: optionalText,
	shortTitle: optionalText,
	season: optionalSeason,
	year: z.number().int().min(1900).optional(),
	episodes: z.number().int().positive().optional(),
	anilistId: z.number().int().positive().optional(),
	malId: z.number().int().positive().optional(),
	note: optionalText,
	skippedEpisodes: optionalText
});

export const AnimeUpdateFormSchema = z.object({
	animeId: z.uuid(),
	titleNative: optionalText,
	titleRomaji: optionalText,
	titleEnglish: optionalText,
	shortTitle: optionalText,
	logoUrl: optionalUrl,
	genres: z.array(genre).default([]),
	links: z.array(link).default([])
});

export const EditSeasonFormSchema = z.object({
	animeSeasonId: z.uuid(),
	sequence: z.number().int().positive(),
	format: formatEnum,
	titleNative: z.string().min(1),
	titleRomaji: optionalText,
	titleEnglish: optionalText,
	shortTitle: optionalText,
	season: optionalSeason,
	year: z.number().int().min(1900).optional(),
	episodes: z.number().int().positive().optional(),
	episodeProgress: z.number().int().nonnegative().optional(),
	anilistId: z.number().int().positive().optional(),
	malId: z.number().int().positive().optional(),
	note: optionalText,
	skippedEpisodes: optionalText
});

export const DeleteAnimeFormSchema = z.object({
	animeId: z.uuid()
});

export const DeleteSeasonFormSchema = z.object({
	seasonId: z.uuid()
});
