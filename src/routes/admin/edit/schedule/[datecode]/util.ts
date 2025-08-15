import * as z from 'zod/v4';
import { getISOWeek } from 'date-fns';
import _ from 'lodash';

export const scheduleAnimeDetail = z.object({
  animeId: z.number().int().positive(),
  animeEpisodeIds: z.array(z.number()),
  watchedAfter: z.string()
});

export const updateFormSchema = z.discriminatedUnion("type", [
  z.object({
    scheduleEntryId: z.number().int().positive(),
    year: z.number().int().min(1900),
    week: z.number().int().min(1).max(53),
    type: z.enum(['anime', 'hololive', 'game', 'event', 'sponsored']),
    date: z.iso.date(),
    time: z.iso.time().nullable(),
    platformIds: z.array(z.number().int().positive()),
    note: z.string().nullable(),
    data: scheduleAnimeDetail,
  })
]).refine(data => {
  const d = new Date(`${data.date}T${data.time ? data.time : '00:00'}Z`);
  return getISOWeek(d) === data.week && d.getUTCFullYear() === data.year;
});

export const createFormSchema = z.discriminatedUnion("type", [
  z.object({
    scheduleId: z.number().int().positive(),
    year: z.number().int().min(1900),
    week: z.number().int().min(1).max(53),
    type: z.enum(['anime', 'hololive', 'game', 'event', 'sponsored']),
    date: z.iso.date(),
    time: z.iso.time().nullable(),
    platformIds: z.array(z.number().int().positive()),
    note: z.string().nullable(),
    data: scheduleAnimeDetail,
  })
]).refine(data => {
  const d = new Date(`${data.date}T${data.time ? data.time : '00:00'}Z`);
  return getISOWeek(d) === data.week && d.getUTCFullYear() === data.year;
});

export const deleteFormSchema = z.object({ scheduleEntryId: z.number().int().positive() });
