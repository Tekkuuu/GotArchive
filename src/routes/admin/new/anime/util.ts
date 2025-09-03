import * as z from 'zod/v4';

const link = z.object({
  url: z.url().nonempty(),
  platformId: z.number().int().positive(),
  note: z.string().nullable()
})

const genre = z.object({
  genreId: z.number().int(),
  name: z.string().nonempty()
})

export const formSchema = z.object({
  titleNative: z.string().nonempty(),
  titleRomaji: z.string().nonempty().nullable(),
  titleEnglish: z.string().nonempty().nullable(),
  shortTitle: z.string().nonempty().nullable(),
  logoUrl: z.url().nonempty().nullable(),
  genres: z.array(genre),
  links: z.array(link)
});

