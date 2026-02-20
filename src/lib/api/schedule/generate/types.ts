import type { GeneratedEntry } from '$lib/server/generateScheduleEntries';

export type { GeneratedEntry };
export type APIGenerateEntriesResponse = { entries: GeneratedEntry[]; slotsToReset: string[] };
