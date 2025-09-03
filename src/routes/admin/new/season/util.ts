import { z } from 'zod';

const zodFormat = z.enum(['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']);
const zodSeason = z.enum(['WINTER', 'SPRING', 'SUMMER', 'FALL']);

const episodeLink = z.object({
  url: z.string().nonempty(),
  platformId: z.number().positive(),
  note: z.string().nullable()
})

const episodeSchema = z.object({
  episodeNumber: z.number().positive(),
  watched: z.boolean().optional(),
  links: z.array(episodeLink)
})

export const formSchema = z.object({
  animeId: z.number().int().positive(),
  sequence: z.number().int().positive(),
  format: zodFormat,
  titleNative: z.string().nonempty(),
  titleRomaji: z.string().nonempty().nullable(),
  titleEnglish: z.string().nonempty().nullable(),
  shortTitle: z.string().nonempty().nullable(),
  season: zodSeason.nullable(),
  year: z.number().int().min(1900).nullable(),
  episodes: z.number().int().positive().nullable(),
  anilistLink: z.string().url(),
  episodeData: z.array(episodeSchema),
})

