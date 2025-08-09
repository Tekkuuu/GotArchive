import * as z from 'zod/v4';

export const formSchema = z.object({
  file: z.file().max(1024 * 1024).mime('application/json')
})

export const validate = z.array(
  z.object({
    anilistId: z.number().int().positive(),
    playlists: z.array(
      z.object({
        url: z.url(),
        platformId: z.number().int().positive(),
        note: z.string().nullable()
      })
    ).nonempty().nullable(),
    seasons: z.array(
      z.object({
        anilistId: z.number().int().positive(),
        episodeLinks: z.array(
          z.object({
            url: z.url(),
            platformId: z.number().int().positive(),
            note: z.string().nullable(),
            episodeNumber: z.number().int().positive(),
          })
        ).nonempty().nullable(),
        watched: z.boolean()
      })
    )
  })
);
