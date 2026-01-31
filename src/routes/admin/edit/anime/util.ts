import * as z from 'zod';

export const formSchema = z.object({
	animeId: z.string().uuid()
});
