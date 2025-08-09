import * as z from 'zod/v4';

export const formSchema = z.object({
  animeId: z.number().int().positive(),
})
