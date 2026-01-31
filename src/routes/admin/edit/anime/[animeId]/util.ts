import _ from 'lodash';
import * as z from 'zod';

export const formSchema = z.object({
	anime: z.object({
		animeId: z.string().uuid(),
		titleNative: z.string().nonempty(),
		titleRomaji: z.string().nonempty().nullable(),
		titleEnglish: z.string().nonempty().nullable(),
		shortTitle: z.string().nonempty().nullable(),
		logoUrl: z.string().url().nonempty().nullable()
	}),
	genres: z.array(
		z.object({
			genreId: z.string().uuid(),
			name: z.string().min(1)
		})
	),
	links: z.array(
		z.object({
			url: z.string().url().nonempty(),
			platformId: z.string().uuid(),
			note: z.string().nullable()
		})
	)
});

export const deleteFormSchema = z.object({
	animeSeasonId: z.string().uuid()
});
