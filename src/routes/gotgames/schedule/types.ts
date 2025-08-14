import type { ApiSchedule } from '$lib/hooks';

export type ScheduleEntry = ApiSchedule['scheduleEntries'][number];

export type MultiAnimeScheduleGroup = {
  type: string;
  date: string;
  time: string | null;
  entries: {
    scheduleEntryId: number;
    animeId: number;
    titleEnglish: string | null;
    titleNative: string;
    titleRomaji: string | null;
    sequence: number;
    episodes: number[];
    platformName: string;
    platformUrl: string;
  }[];
};

export type WeekdayScheduleGroup = {
  date: string;
  entries: MultiAnimeScheduleGroup[];
};
