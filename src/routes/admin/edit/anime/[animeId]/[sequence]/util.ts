import * as z from 'zod/v4';

const zodFormat = z.enum(['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']);
const zodSeason = z.enum(['WINTER', 'SPRING', 'SUMMER', 'FALL']);

export const formSchema = z.object({
  animeId: z.number().int().positive(),
  sequence: z.number().int().positive(),
  format: zodFormat,
  titleNative: z.string().nonempty(),
  titleRomaji: z.string().nonempty().nullable(),
  titleEnglish: z.string().nonempty().nullable(),
  season: zodSeason.nullable(),
  year: z.number().int().positive().nullable(),
  episodes: z.number().int().positive().nullable(),
  anilistLink: z.url(),
});

const episodeSchema = z.object({
  animeEpisodeId: z.number().int().positive(),
  episodeNumber: z.number().int(),
  watched: z.boolean(),
});

export const updateEpisodesFormSchema = z.object({
  episodes: z.array(episodeSchema),
})
