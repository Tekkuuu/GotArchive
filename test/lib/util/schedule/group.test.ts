import { describe, it, expect } from 'vitest';
import { groupScheduleByWeek } from '../../../../src/lib/util/schedule/group';
import { GroupedScheduleWeek, GroupedAnimeEntryGroup } from '../../../../src/lib/util/schedule/types';

// Helper to deeply sort arrays by entries for comparison, especially for unordered arrays
function deepSort(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(deepSort).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  if (obj && typeof obj === 'object') {
    const sorted: any = {};
    Object.keys(obj).sort().forEach(k => sorted[k] = deepSort(obj[k]));
    return sorted;
  }
  return obj;
}

describe('groupScheduleByWeek', () => {
  it('handles multi-platform, multi-type, multi-show, and empty days', () => {
    const rawInput = {
      scheduleInfo: {
        scheduleId: 1,
        year: 2025,
        week: 36,
        note: null
      },
      scheduleEntries: [
        // Mon, two platforms, same anime
        {
          scheduleEntry: { scheduleEntryId: 1, type: "anime", date: "2025-09-01", time: "12:00:00", note: null, platformId: 1 },
          anime: { animeId: 1, sequence: 1, titleEnglish: "A", titleNative: "A", titleRomaji: "A", episodes: [1] }, misc: null
        },
        {
          scheduleEntry: { scheduleEntryId: 1, type: "anime", date: "2025-09-01", time: "12:00:00", note: null, platformId: 2 },
          anime: { animeId: 1, sequence: 1, titleEnglish: "A", titleNative: "A", titleRomaji: "A", episodes: [1] }, misc: null
        },
        // Mon, another show, same slot
        {
          scheduleEntry: { scheduleEntryId: 5, type: "anime", date: "2025-09-01", time: "12:00:00", note: "Test note", platformId: 1 },
          anime: { animeId: 3, sequence: 1, titleEnglish: "C", titleNative: "C", titleRomaji: "C", episodes: [6, 7, 8, 9, 10] }, misc: null
        },
        // Mon, later time
        {
          scheduleEntry: { scheduleEntryId: 2, type: "anime", date: "2025-09-01", time: "14:00:00", note: null, platformId: 1 },
          anime: { animeId: 2, sequence: 1, titleEnglish: "B", titleNative: "B", titleRomaji: "B", episodes: [1, 2, 3, 4, 5] }, misc: null
        },
        // Mon, misc type
        {
          scheduleEntry: { scheduleEntryId: 3, type: "misc", date: "2025-09-01", time: "12:00:00", note: null, platformId: 2 },
          anime: null, misc: { title: "B", description: "B" }
        },
        // Wed, misc, multi-platform
        {
          scheduleEntry: { scheduleEntryId: 4, type: "misc", date: "2025-09-03", time: "20:00:00", note: null, platformId: 3 },
          anime: null, misc: { title: "C", description: "C" }
        },
        {
          scheduleEntry: { scheduleEntryId: 4, type: "misc", date: "2025-09-03", time: "20:00:00", note: null, platformId: 4 },
          anime: null, misc: { title: "C", description: "C" }
        }
      ]
    };

    const output = [
      {
        date: '2025-09-01',
        entries: [
          {
            type: 'anime',
            date: '2025-09-01',
            time: '12:00:00',
            entries: [
              {
                scheduleEntryId: 1,
                animeId: 1,
                sequence: 1,
                titleEnglish: 'A',
                titleNative: 'A',
                titleRomaji: 'A',
                episodes: [1],
                platformIds: [1, 2],
                note: null,
              },
              {
                scheduleEntryId: 5,
                animeId: 3,
                sequence: 1,
                titleEnglish: 'C',
                titleNative: 'C',
                titleRomaji: 'C',
                episodes: [6, 7, 8, 9, 10],
                platformIds: [1],
                note: 'Test note'
              }
            ]
          },
          {
            type: 'misc',
            date: '2025-09-01',
            time: '12:00:00',
            entries: [
              {
                title: 'B',
                description: 'B',
                platformIds: [2]
              }
            ]
          },
          {
            type: 'anime',
            date: '2025-09-01',
            time: '14:00:00',
            entries: [
              {
                scheduleEntryId: 2,
                animeId: 2,
                sequence: 1,
                titleEnglish: 'B',
                titleNative: 'B',
                titleRomaji: 'B',
                episodes: [1, 2, 3, 4, 5],
                platformIds: [1],
                note: null
              }
            ]
          }
        ]
      },
      {
        date: '2025-09-02',
        entries: []
      },
      {
        date: '2025-09-03',
        entries: [
          {
            type: 'misc',
            date: '2025-09-03',
            time: '20:00:00',
            entries: [
              {
                title: 'C',
                description: 'C',
                platformIds: [3, 4]
              }
            ]
          }
        ]
      },
      {
        date: '2025-09-04',
        entries: []
      },
      {
        date: '2025-09-05',
        entries: []
      },
      {
        date: '2025-09-06',
        entries: []
      },
      {
        date: '2025-09-07',
        entries: []
      },
    ];

    expect(deepSort(groupScheduleByWeek(rawInput))).toEqual(deepSort(output));
  });

  it('handles empty scheduleEntries', () => {
    const rawInput = {
      scheduleInfo: { scheduleId: 1, year: 2025, week: 36, note: null },
      scheduleEntries: []
    };
    const expected = [
      { date: 'Invalid Date', entries: [] },
      { date: 'Invalid Date', entries: [] },
      { date: 'Invalid Date', entries: [] },
      { date: 'Invalid Date', entries: [] },
      { date: 'Invalid Date', entries: [] },
      { date: 'Invalid Date', entries: [] },
      { date: 'Invalid Date', entries: [] },
    ];
    expect(groupScheduleByWeek(rawInput)).toEqual(expected);
  });

  it('handles multiple entries at same time with different types', () => {
    const rawInput = {
      scheduleInfo: { scheduleId: 1, year: 2025, week: 36, note: null },
      scheduleEntries: [
        {
          scheduleEntry: { scheduleEntryId: 1, type: "anime", date: "2025-09-01", time: "11:00:00", note: null, platformId: 1 },
          anime: { animeId: 1, sequence: 1, titleEnglish: "A", titleNative: "A", titleRomaji: "A", episodes: [1] }, misc: null
        },
        {
          scheduleEntry: { scheduleEntryId: 2, type: "misc", date: "2025-09-01", time: "11:00:00", note: null, platformId: 1 },
          anime: null, misc: { title: "X", description: "desc" }
        }
      ]
    };

    const out = groupScheduleByWeek(rawInput);
    const day = out.find(d => d.date === "2025-09-01");
    expect(day?.entries).toHaveLength(2);
    expect(day?.entries.map(e => e.type).sort()).toEqual(['anime', 'misc']);
  });

  it('handles entries on all days (full week coverage)', () => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = `2025-09-0${i + 1}`;
      return {
        scheduleEntry: { scheduleEntryId: i + 1, type: "anime", date, time: "10:00:00", note: null, platformId: 1 },
        anime: { animeId: i + 1, sequence: 1, titleEnglish: "Show", titleNative: "Show", titleRomaji: "Show", episodes: [1] },
        misc: null
      };
    });
    const rawInput = { scheduleInfo: { scheduleId: 1, year: 2025, week: 36, note: null }, scheduleEntries: days };

    const out = groupScheduleByWeek(rawInput);
    expect(out.every(day => day.entries.length === 1)).toBe(true);
    expect(out.length).toBe(7);
  });

  it('handles entries with missing misc and anime', () => {
    const rawInput = {
      scheduleInfo: { scheduleId: 1, year: 2025, week: 36, note: null },
      scheduleEntries: [
        {
          scheduleEntry: { scheduleEntryId: 1, type: "anime", date: "2025-09-01", time: "12:00:00", note: null, platformId: 1 },
          anime: null, misc: null
        },
        {
          scheduleEntry: { scheduleEntryId: 2, type: "misc", date: "2025-09-01", time: "13:00:00", note: null, platformId: 2 },
          anime: null, misc: null
        }
      ]
    };
    const out = groupScheduleByWeek(rawInput);
    // Should not throw, should include blank entries in output
    expect(out.find(d => d.date === '2025-09-01')?.entries.length).toBe(2);
  });

  it('handles entries with duplicate scheduleEntryId but different platforms', () => {
    const rawInput = {
      scheduleInfo: { scheduleId: 1, year: 2025, week: 36, note: null },
      scheduleEntries: [
        {
          scheduleEntry: { scheduleEntryId: 1, type: "anime", date: "2025-09-01", time: "12:00:00", note: null, platformId: 1 },
          anime: { animeId: 1, sequence: 1, titleEnglish: "A", titleNative: "A", titleRomaji: "A", episodes: [1] }, misc: null
        },
        {
          scheduleEntry: { scheduleEntryId: 1, type: "anime", date: "2025-09-01", time: "12:00:00", note: null, platformId: 2 },
          anime: { animeId: 1, sequence: 1, titleEnglish: "A", titleNative: "A", titleRomaji: "A", episodes: [1] }, misc: null
        }
      ]
    };
    const out: GroupedScheduleWeek = groupScheduleByWeek(rawInput);
    const day = out.find(d => d.date === '2025-09-01');
    expect(day).toBeDefined();

    const animeGroup = day!.entries.find(e => e.type === 'anime' && e.time === '12:00:00');
    expect(animeGroup).toBeDefined();

    // Now TypeScript knows this is GroupedScheduleAnime
    const animeEntries = (animeGroup as GroupedAnimeEntryGroup).entries;
    expect(animeEntries[0]?.platformIds.sort()).toEqual([1, 2]);
  });

  it('handles entries with the same anime but different sequence', () => {
    const rawInput = {
      scheduleInfo: { scheduleId: 1, year: 2025, week: 36, note: null },
      scheduleEntries: [
        {
          scheduleEntry: { scheduleEntryId: 1, type: "anime", date: "2025-09-01", time: "12:00:00", note: null, platformId: 1 },
          anime: { animeId: 1, sequence: 1, titleEnglish: "A1", titleNative: "A1", titleRomaji: "A1", episodes: [1] }, misc: null
        },
        {
          scheduleEntry: { scheduleEntryId: 1, type: "anime", date: "2025-09-01", time: "12:00:00", note: null, platformId: 2 },
          anime: { animeId: 1, sequence: 2, titleEnglish: "A2", titleNative: "A2", titleRomaji: "A2", episodes: [2] }, misc: null
        }
      ]
    };
    const out: GroupedScheduleWeek = groupScheduleByWeek(rawInput);
    const day = out.find(d => d.date === '2025-09-01');
    expect(day).toBeDefined();

    // Should have one anime group for this one given time slot
    const animeGroups = day!.entries.filter(e => e.type === 'anime');
    expect(animeGroups.length).toBe(1);

    const animeEntries = (animeGroups[0] as GroupedAnimeEntryGroup).entries;
    expect(animeEntries.length).toBe(2);
    expect(animeEntries[0].sequence).toBe(1);
    expect(animeEntries[1].sequence).toBe(2);
  });
});
