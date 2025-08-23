export type GroupedWeekday = {
  date: string;
  entries: Array<GroupedAnimeEntryGroup | GroupedMiscEntryGroup>;
};

export type GroupedAnimeEntryGroup = {
  type: 'anime';
  date: string;
  time: string;
  entries: Array<{
    scheduleEntryId: number;
    animeId: number | null;
    sequence: number | null;
    titleEnglish: string | null;
    titleNative: string | null;
    titleRomaji: string | null;
    episodes: number[];
    platformIds: number[];
    note: string | null;
  }>;
};

export type GroupedMiscEntryGroup = {
  type: 'misc';
  date: string;
  time: string;
  entries: Array<{
    title: string | null;
    description: string | null;
    platformIds: number[];
  }>;
};

export type GroupedScheduleWeek = GroupedWeekday[];
