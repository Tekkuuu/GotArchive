import * as z from 'zod/v4';

export const scheduleAnimeDetail = z.object({
  animeId: z.number().int().positive(),
  animeEpisodeIds: z.array(z.number()),
  watchedAfter: z.string()
});

export const updateFormSchema = z.discriminatedUnion("type", [
  z.object({
    scheduleEntryId: z.number().int().positive(),
    type: z.enum(['anime', 'hololive', 'game', 'event', 'sponsored']),
    date: z.iso.date(),
    time: z.iso.time().nullable(),
    platformIds: z.array(z.number().int().positive()),
    note: z.string().nullable(),
    data: scheduleAnimeDetail,
  })
]);

export const createFormSchema = z.discriminatedUnion("type", [
  z.object({
    scheduleId: z.number().int().positive(),
    type: z.enum(['anime', 'hololive', 'game', 'event', 'sponsored']),
    date: z.iso.date(),
    time: z.iso.time().nullable(),
    platformIds: z.array(z.number().int().positive()),
    note: z.string().nullable(),
    data: scheduleAnimeDetail,
  })
]);

export const deleteFormSchema = z.object({ scheduleEntryId: z.number().int().positive() });
