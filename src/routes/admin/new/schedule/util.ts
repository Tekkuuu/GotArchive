import * as z from 'zod';
import _ from 'lodash';
import { getISOWeek } from 'date-fns';

export const schedule = z.object({
  note: z.string().nullable(),
  year: z.number().int().min(1900),
  week: z.number().int().min(1).max(53),
  preview: z.boolean().default(false)
});

export const scheduleAnimeDetail = z.object({
  animeId: z.number().int().positive(),
  animeEpisodeIds: z.array(z.number()),
  watchedAfter: z.string()
});

export const scheduleMiscDetail = z.object({
  title: z.string(),
  description: z.string().nullable(),
})

const baseScheduleEntry = {
  date: z.iso.date(),
  time: z.iso.time().nullable(),
  platformIds: z.array(z.number().int().positive()).nonempty(),
  note: z.string().nullable(),
};

export const scheduleEntry = z.discriminatedUnion("type", [
  z.object({
    type: z.literal('anime'),
    ...baseScheduleEntry,
    data: scheduleAnimeDetail,
  }),
  z.object({
    type: z.literal('misc'),
    ...baseScheduleEntry,
    data: scheduleMiscDetail,
  })
]);

export const formSchema = z.object({
  schedule: schedule,
  entries: z.array(scheduleEntry)
}).refine(data => {
  return _.every(data.entries, (e) => {
    const d = new Date(`${e.date}T${e.time ? e.time : '00:00'}Z`);
    return getISOWeek(d) === data.schedule.week && d.getUTCFullYear() === data.schedule.year;
  })
})

export function uniqueKey(data: z.infer<typeof scheduleEntry>) {
  const generalKey = `${data.type}|${data.date}|${data.time ?? 'NULL'}`;
  switch (data.type) {
    case 'anime':
      return `${generalKey}|${data.data.animeId}|${_.sortBy(data.data.animeEpisodeIds).join('|')}`;
    default:
      return generalKey;
  }
}
