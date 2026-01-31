import * as z from 'zod';

export const formSchema = z.object({
	file: z
		.file()
		.max(1024 * 1024)
		.mime('application/json')
});

export const validate = z.array(
	z.object({
		anilistId: z.number().int().positive(),
		playlists: z
			.array(
				z.object({
					url: z.string().url(),
					platformId: z.string().uuid(),
					note: z.string().nullable()
				})
			)
			.nonempty()
			.nullable(),
		seasons: z.array(
			z.object({
				anilistId: z.number().int().positive(),
				episodeLinks: z
					.array(
						z.object({
							url: z.string().url(),
							platformId: z.string().uuid(),
							note: z.string().nullable(),
							episodeNumber: z.number().int().positive()
						})
					)
					.nonempty()
					.nullable(),
				watched: z.boolean()
			})
		)
	})
);
