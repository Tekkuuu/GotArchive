import * as z from 'zod';

const link = z.object({
  url: z.string().url().nonempty(),
  platformId: z.string().uuid(),
  note: z.string().nullable()
});

const genre = z.object({
  genreId: z.string().uuid(),
  name: z.string().nonempty()
});

export const formSchema = z.object({
  titleNative: z.string().nonempty(),
  titleRomaji: z.string().nonempty().nullable(),
  titleEnglish: z.string().nonempty().nullable(),
  shortTitle: z.string().nonempty().nullable(),
  logoUrl: z.string().url().nonempty().nullable(),
  genres: z.array(genre),
  links: z.array(link)
});
