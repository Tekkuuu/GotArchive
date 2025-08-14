import * as z from 'zod/v4';
import _ from 'lodash';

export const schedule = z.object({
  note: z.string().nullable(),
  year: z.number().int().min(1900),
  week: z.number().int().min(1).max(53)
});

export const scheduleAnimeDetail = z.object({
  animeId: z.number().int().positive(),
  animeEpisodeIds: z.array(z.number()),
  watchedAfter: z.string()
});

export const scheduleEntry = z.discriminatedUnion("type", [
  z.object({
    type: z.enum(['anime', 'hololive', 'game', 'event', 'sponsored']),
    date: z.iso.date(),
    time: z.iso.time().nullable(),
    platformIds: z.array(z.number().int().positive()),
    note: z.string().nullable(),
    data: scheduleAnimeDetail,
  })
]);

export const formSchema = z.object({
  schedule: schedule,
  entries: z.array(scheduleEntry)
});

export function uniqueKey(data: z.infer<typeof scheduleEntry>) {
  const generalKey = `${data.type}|${data.date}|${data.time ?? 'NULL'}`;
  switch (data.type) {
    case 'anime':
      return `${generalKey}|${data.data.animeId}|${_.sortBy(data.data.animeEpisodeIds).join('|')}`;
    default:
      return generalKey;
  }
}
