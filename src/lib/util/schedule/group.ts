import type { Schedule } from '$lib/hooks';
import { format, parseISO, eachDayOfInterval } from 'date-fns';
import _ from 'lodash';
import type { GroupedScheduleWeek } from './types';

/**
 * Transforms a merged array of schedule entries into an array of 7 weekdays.
 * Each weekday contains entries grouped by type/date/time, where each group holds the relevant schedule entries.
 */
export function groupScheduleToWeekdays(merged: any[]): any[] {
  // Guard: If merged is empty, return 7 empty days with 'Invalid Date'
  if (!merged || merged.length === 0) {
    return Array.from({ length: 7 }, () => ({
      date: 'Invalid Date',
      entries: []
    }));
  }

  // Collect all unique dates from merged entries
  const allDates = merged.map(e => e.scheduleEntry.date);
  const weekStart = parseISO(_.min(allDates)!);
  // Generate 7 sequential dates as strings for the week
  const weekDates = eachDayOfInterval({
    start: weekStart,
    end: new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + 6)
  }).map(d => format(d, 'yyyy-MM-dd'));

  // Group merged entries by date
  const groupedByDate = _.groupBy(merged, e => e.scheduleEntry.date);

  return weekDates.map(date => {
    // For each date, further group by type + date + time for correct grouping of entries at the same slot
    const dayEntries = groupedByDate[date] ?? [];
    const entriesGrouped = _.groupBy(dayEntries, e =>
      `${e.scheduleEntry.type}|${e.scheduleEntry.date}|${e.scheduleEntry.time}`
    );

    // Create the final grouped structure for each entry group
    const entries = Object.values(entriesGrouped).map((group) => {
      const entry = group[0];
      if (entry.scheduleEntry.type === 'anime') {
        return {
          type: 'anime',
          date: entry.scheduleEntry.date,
          time: entry.scheduleEntry.time,
          entries: group.map(animeEntry => {
            // Defensive: handle missing anime
            const a = animeEntry.anime ?? {};
            return {
              scheduleEntryId: animeEntry.scheduleEntry.scheduleEntryId,
              animeId: a.animeId ?? null,
              sequence: a.sequence ?? null,
              titleEnglish: a.titleEnglish ?? null,
              titleNative: a.titleNative ?? null,
              titleRomaji: a.titleRomaji ?? null,
              episodes: a.episodes ?? [],
              platformIds: animeEntry.scheduleEntry.platformIds,
              note: animeEntry.scheduleEntry.note
            }
          })
        };
      }
      if (entry.scheduleEntry.type === 'misc') {
        return {
          type: 'misc',
          date: entry.scheduleEntry.date,
          time: entry.scheduleEntry.time,
          entries: group.map(miscEntry => {
            // Defensive: handle missing misc
            const m = miscEntry.misc ?? {};
            return {
              title: m.title ?? null,
              description: m.description ?? null,
              platformIds: miscEntry.scheduleEntry.platformIds
            }
          })
        };
      }
    });

    // Sort entries for each day by time and type for consistency
    return {
      date,
      entries: _.sortBy(entries, ['time', 'type'])
    };
  });
}

/**
 * Takes a Schedule and returns the grouped structure for weekly display.
 * Sorts, merges by scheduleEntryId (combining platformIds), then groups by weekday.
 */
export function groupScheduleByWeek(schedule: Schedule): GroupedScheduleWeek {
  // Sort entries for consistent grouping
  const sorted = _.sortBy(
    schedule.scheduleEntries,
    ['scheduleEntry.type', 'scheduleEntry.date', 'scheduleEntry.time']
  );

  // Group by scheduleEntryId and merge platformIds for multi-platform entries
  const merged = Object.values(
    _.groupBy(
      sorted,
      (s) => `${s.scheduleEntry.scheduleEntryId}|${s.anime?.animeId || 'null'}|${s.anime?.sequence || 'null'}`
    )
  ).map(entries => {
    const { scheduleEntry, anime, misc } = entries[0];
    const platformIds = entries.map(e => e.scheduleEntry.platformId);
    // Destructure to remove single platformId, add platformIds array
    const { platformId, ...restEntry } = scheduleEntry;
    return {
      scheduleEntry: {
        ...restEntry,
        platformIds,
      },
      anime,
      misc
    }
  });

  // Group merged entries into 7 weekdays
  return groupScheduleToWeekdays(merged);
}
