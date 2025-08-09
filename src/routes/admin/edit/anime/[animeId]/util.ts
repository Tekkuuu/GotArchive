import _ from 'lodash';
import * as z from 'zod';

export const formSchema = z.object({
  anime: z.object({
    animeId: z.number().positive(),
    titleNative: z.string().nonempty(),
    titleRomaji: z.string().nonempty().nullable(),
    titleEnglish: z.string().nonempty().nullable(),
  }),
  genres: z.array(z.object({
    genreId: z.number(),
    name: z.string().min(1)
  })),
  links: z.array(z.object({
    url: z.string().url(),
    platformId: z.number(),
    note: z.string().nullable(),
  })),
});

export const deleteFormSchema = z.object({
  animeId: z.number().int().nonnegative(),
  sequence: z.number().int().nonnegative()
});
