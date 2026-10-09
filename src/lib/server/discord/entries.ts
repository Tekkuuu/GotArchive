import { getISOWeek, getISOWeekYear } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '$lib/server/db';
import { fetchEntriesForSchedule, parseDatecode } from '$lib/server/schedule/queries';
import type { ScheduleEntryData } from '$lib/api/schedule/datecode';
import { DAY_NAMES } from '$lib/schemas';

export interface EntryChoice {
	id: string;
	label: string;
	cancelled: boolean;
}

export function currentDatecode(): string {
	const now = new Date();
	return `${getISOWeekYear(now)}${String(getISOWeek(now)).padStart(2, '0')}`;
}

function buildLabel(entry: ScheduleEntryData): string {
	const anime = entry.animeSeasons[0];
	const title =
		entry.title ||
		anime?.shortTitle ||
		anime?.titleEnglish ||
		anime?.titleRomaji ||
		anime?.titleNative ||
		'Untitled';
	const day = DAY_NAMES[entry.dayOfWeek] ?? '';
	const suffix = entry.isCancelled ? ' (cancelled)' : '';

	return `${day} · ${title}${suffix}`.trim();
}

async function loadEntries(year: number, week: number): Promise<ScheduleEntryData[]> {
	const [schedule] = await db
		.select({ scheduleId: schema.schedule.scheduleId })
		.from(schema.schedule)
		.where(and(eq(schema.schedule.year, year), eq(schema.schedule.week, week)))
		.limit(1);

	if (!schedule) return [];

	return fetchEntriesForSchedule(schedule.scheduleId);
}

export async function listEntryChoices(datecode?: string | null): Promise<EntryChoice[]> {
	const dc = datecode?.trim() ? datecode.trim() : currentDatecode();
	const parsed = parseDatecode(dc);
	if (!parsed) return [];

	const entries = await loadEntries(parsed.year, parsed.week);

	return entries.map((entry) => ({
		id: entry.scheduleEntryId,
		label: buildLabel(entry),
		cancelled: entry.isCancelled
	}));
}

export async function getEntryLabel(scheduleEntryId: string): Promise<string | null> {
	const [entry] = await db
		.select({
			scheduleId: schema.scheduleEntry.scheduleId,
			title: schema.scheduleEntry.title
		})
		.from(schema.scheduleEntry)
		.where(eq(schema.scheduleEntry.scheduleEntryId, scheduleEntryId))
		.limit(1);

	if (!entry) return null;

	const [schedule] = await db
		.select({ year: schema.schedule.year, week: schema.schedule.week })
		.from(schema.schedule)
		.where(eq(schema.schedule.scheduleId, entry.scheduleId))
		.limit(1);

	if (schedule) {
		const entries = await loadEntries(schedule.year, schedule.week);
		const found = entries.find((e) => e.scheduleEntryId === scheduleEntryId);
		if (found) return buildLabel(found);
	}

	return entry.title ?? 'Entry';
}
