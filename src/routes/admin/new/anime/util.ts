import { z } from 'zod/v4';

const link = z.object({
  url: z.url(),
  platformId: z.uuid(),
  note: z.string().nullable()
});

const genre = z.object({
  genreId: z.uuid(),
  name: z.string().min(1)
});

export const formSchema = z.object({
  titleNative: z.string().min(1),
  titleRomaji: z.string().min(1).nullable(),
  titleEnglish: z.string().min(1).nullable(),
  shortTitle: z.string().min(1).nullable(),
  logoUrl: z.url().nullable(),
  genres: z.array(genre),
  links: z.array(link),
});
