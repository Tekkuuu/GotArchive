import { z } from 'zod/v4';

const zodFormat = z.enum(['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']);
const zodSeason = z.enum(['WINTER', 'SPRING', 'SUMMER', 'FALL']);

export const formSchema = z.object({
	animeId: z.uuid(),
	sequence: z.number().int().positive(),
	format: zodFormat,
	titleNative: z.string().min(1),
	titleRomaji: z.string().min(1).nullable(),
	titleEnglish: z.string().min(1).nullable(),
	shortTitle: z.string().min(1).nullable(),
	season: zodSeason.nullable(),
	year: z.number().int().min(1900).nullable(),
	episodes: z.number().int().positive().nullable(),
	anilistId: z.number().int().positive().nullable(),
	malId: z.number().int().positive().nullable(),
	note: z.string().nullable()
});
