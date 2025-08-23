import * as z from 'zod/v4';
import { getISOWeek } from 'date-fns';
import _ from 'lodash';

export const scheduleAnimeDetail = z.object({
  animeId: z.number().int().positive(),
  animeEpisodeIds: z.array(z.number()),
  watchedAfter: z.string()
});

export const scheduleMiscDetail = z.object({
  title: z.string(),
  description: z.string().nullable(),
});

export const baseEntry = {
  year: z.number().int().min(1900),
  week: z.number().int().min(1).max(53),
  date: z.iso.date(),
  time: z.iso.time().nullable(),
  platformIds: z.array(z.number().int().positive()).nonempty(),
  note: z.string().nullable(),
}

export const updateFormSchema = z.discriminatedUnion("type", [
  z.object({
    scheduleEntryId: z.number().int().positive(),
    type: z.literal('anime'),
    ...baseEntry,
    data: scheduleAnimeDetail,
  }),
  z.object({
    scheduleEntryId: z.number().int().positive(),
    type: z.literal('misc'),
    ...baseEntry,
    data: scheduleMiscDetail
  })
]).refine(data => {
  // Check if entry date is in the correct week and year
  const d = new Date(`${data.date}T${data.time ? data.time : '00:00'}Z`);
  return getISOWeek(d) === data.week && d.getUTCFullYear() === data.year;
});

export const createFormSchema = z.discriminatedUnion("type", [
  z.object({
    scheduleId: z.number().int().positive(),
    type: z.literal('anime'),
    ...baseEntry,
    data: scheduleAnimeDetail,
  }),
  z.object({
    scheduleId: z.number().int().positive(),
    type: z.literal('misc'),
    ...baseEntry,
    data: scheduleMiscDetail
  })
]).refine(data => {
  // Check if entry date is in the correct week and year
  const d = new Date(`${data.date}T${data.time ? data.time : '00:00'}Z`);
  return getISOWeek(d) === data.week && d.getUTCFullYear() === data.year;
});

export const deleteFormSchema = z.object({ scheduleEntryId: z.number().int().positive() });
