import { useSchedule } from "./useSchedule";
import { useWatchingWeek } from "./useWatchingWeek";
import type * as DB from '$lib/server/db';

export type RawSchedule = Awaited<ReturnType<typeof useSchedule>>;
export type Schedule = {
  scheduleInfo: DB.Schedule;
  scheduleEntries: ScheduleEntry[];
}

export type WatchingWeek = Awaited<ReturnType<typeof useWatchingWeek>>;

export type ScheduleEntry = {
  scheduleEntry: Omit<DB.ScheduleEntry, 'scheduleId'> & { platformId: number };
  anime?: {
    animeId: number;
    sequence: number;
    titleEnglish: string;
    titleNative: string;
    titleRomaji: string;
    episodes: number[];
    watchedAfter?: Date;
  } | null;
  misc?: {
    title: string;
    description: string | null;
  } | null;
};
