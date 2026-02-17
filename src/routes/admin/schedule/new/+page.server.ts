import type { PageServerLoad, Actions } from './$types';
import { schema, db, eq, asc, sql } from '$lib/server/db';
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { ScheduleSchema } from './util';
import { getWeek, getYear, startOfWeek, addDays, format } from 'date-fns';
import { fail, redirect } from '@sveltejs/kit';
import { AppError, ERROR_CODES } from '$lib/errors';

export const load: PageServerLoad = async () => {
	// Load all active schedule slots with their platforms and anime info
	const slots = await db
		.select({
			slot: schema.scheduleSlot,
			anime: schema.anime,
			platforms: sql<
				Array<string>
			>`array_agg(${schema.platform.platformId} ORDER BY ${schema.platform.name} ASC)`
		})
		.from(schema.scheduleSlot)
		.leftJoin(schema.anime, eq(schema.scheduleSlot.animeId, schema.anime.animeId))
		.leftJoin(
			schema.scheduleSlotPlatform,
			eq(schema.scheduleSlot.scheduleSlotId, schema.scheduleSlotPlatform.scheduleSlotId)
		)
		.leftJoin(
			schema.platform,
			eq(schema.scheduleSlotPlatform.platformId, schema.platform.platformId)
		)
		.where(eq(schema.scheduleSlot.isActive, true))
		.groupBy(schema.scheduleSlot.scheduleSlotId, schema.anime.animeId)
		.orderBy(asc(schema.scheduleSlot.dayOfWeek), asc(schema.scheduleSlot.time));

	// Load all anime seasons
	const animeSeasons = await db
		.select()
		.from(schema.animeSeason)
		.orderBy(asc(schema.animeSeason.animeId), asc(schema.animeSeason.sequence));

	// Calculate the current week and year
	const now = new Date();
	const currentWeek = getWeek(now, { weekStartsOn: 1 }); // Monday = 1
	const currentYear = getYear(now);

	// Calculate entries for each slot based on episode progression
	const animeProgress = new Map<string, { sequence: number; episode: number }>();
	const entries = [];

	// Sort slots by day and time
	const sortedSlots = [...slots].sort((a, b) => {
		if (a.slot.dayOfWeek !== b.slot.dayOfWeek) {
			return a.slot.dayOfWeek - b.slot.dayOfWeek;
		}
		if (a.slot.time && b.slot.time) {
			return a.slot.time.localeCompare(b.slot.time);
		}
		return 0;
	});

	// Get the start of the week (Monday)
	const weekStart = startOfWeek(now, { weekStartsOn: 1 });

	for (const slotData of sortedSlots) {
		const { slot } = slotData;

		// Calculate the date for this slot (dayOfWeek: 0=Monday, 1=Tuesday, ..., 6=Sunday)
		const dayOffset = slot.dayOfWeek;
		const entryDate = addDays(weekStart, dayOffset);
		const dateStr = format(entryDate, 'yyyy-MM-dd');

		// Get platform IDs (filter out nulls)
		const platformIds = slotData.platforms?.filter((id): id is string => id !== null) || [];

		if (slot.type === 'anime' && slot.animeId && slot.startingSequence && slot.startingEpisode) {
			// Initialize progress if not set
			if (!animeProgress.has(slot.animeId)) {
				animeProgress.set(slot.animeId, {
					sequence: slot.startingSequence,
					episode: slot.startingEpisode
				});
			}

			const currentProgress = animeProgress.get(slot.animeId)!;
			const epCount = slot.episodeCount || 1;

			// Get anime seasons for this anime
			const animeSeasonsForAnime = animeSeasons.filter((s) => s.animeId === slot.animeId);

			// Build anime season entries (may span multiple seasons)
			const animeSeasonEntries: Array<{ animeSeasonId: string; episodes: string }> = [];
			let remainingEpisodes = epCount;
			let currentEpisode = currentProgress.episode;
			let currentSeq = currentProgress.sequence;

			while (remainingEpisodes > 0) {
				const currentSeason = animeSeasonsForAnime.find((s) => s.sequence === currentSeq);

				if (!currentSeason) {
					// No more seasons available
					break;
				}

				const seasonMaxEpisodes = currentSeason.episodes || 1;
				const episodesInCurrentSeason = Math.min(
					remainingEpisodes,
					seasonMaxEpisodes - currentEpisode + 1
				);

				if (episodesInCurrentSeason > 0) {
					const episodeStart = currentEpisode;
					const episodeEnd = currentEpisode + episodesInCurrentSeason - 1;

					animeSeasonEntries.push({
						animeSeasonId: currentSeason.animeSeasonId,
						episodes:
							episodeStart === episodeEnd ? `${episodeStart}` : `${episodeStart}-${episodeEnd}`
					});

					remainingEpisodes -= episodesInCurrentSeason;

					// Move to next season if we've exhausted this one
					if (episodeEnd >= seasonMaxEpisodes) {
						currentSeq++;
						currentEpisode = 1;
					} else {
						currentEpisode = episodeEnd + 1;
					}
				} else {
					// Edge case: no episodes fit in current season
					currentSeq++;
					currentEpisode = 1;
				}
			}

			// Create entry
			entries.push({
				type: 'anime' as const,
				date: dateStr,
				time: slot.time,
				note: slot.note,
				logoUrl: slot.logoUrl,
				title: slot.title,
				description: slot.description,
				cancelledText: slot.cancelledText,
				isCancelled: false,
				anime: animeSeasonEntries.length > 0 ? animeSeasonEntries : null,
				platforms: platformIds.length > 0 ? platformIds : null,
				slotId: slot.scheduleSlotId
			});

			// Update progress to the next episode
			currentProgress.sequence = currentSeq;
			currentProgress.episode = currentEpisode;
		} else {
			// Non-anime entry
			entries.push({
				type: slot.type || 'misc',
				date: dateStr,
				time: slot.time,
				note: slot.note,
				logoUrl: slot.logoUrl,
				title: slot.title,
				description: slot.description,
				cancelledText: slot.cancelledText,
				isCancelled: false,
				anime: null,
				platforms: platformIds.length > 0 ? platformIds : null,
				slotId: slot.scheduleSlotId
			});
		}
	}

	// Prefill the form
	const form = await superValidate(
		{
			schedule: {
				year: currentYear,
				week: currentWeek + 1,
				note: '',
				preview: true
			},
			entries
		},
		zod4(ScheduleSchema)
	);

	return { form, slots, animeSeasons };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const form = await superValidate(request, zod4(ScheduleSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		// Validate that we have at least one entry
		if (!form.data.entries || form.data.entries.length === 0) {
			return fail(400, {
				form,
				error: 'Schedule must have at least one entry.'
			});
		}

		try {
			// Check if schedule already exists for this year/week
			const existingSchedule = await db
				.select()
				.from(schema.schedule)
				.where(
					sql`${schema.schedule.year} = ${form.data.schedule.year} AND ${schema.schedule.week} = ${form.data.schedule.week}`
				)
				.limit(1);

			if (existingSchedule.length > 0) {
				return fail(409, {
					form,
					error: `Schedule for year ${form.data.schedule.year}, week ${form.data.schedule.week} already exists.`
				});
			}

			// Use a transaction to ensure atomicity
			await db.transaction(async (tx) => {
				// Insert schedule
				const [scheduleRecord] = await tx
					.insert(schema.schedule)
					.values({
						year: form.data.schedule.year,
						week: form.data.schedule.week,
						note: form.data.schedule.note || null,
						preview: form.data.schedule.preview
					})
					.returning();

				// Insert entries
				for (const entry of form.data.entries) {
					const [entryRecord] = await tx
						.insert(schema.scheduleEntry)
						.values({
							scheduleId: scheduleRecord.scheduleId,
							type: entry.type,
							date: entry.date,
							time: entry.time || null,
							note: entry.note || null,
							logoUrl: entry.logoUrl || null,
							title: entry.title || null,
							description: entry.description || null,
							cancelledText: entry.cancelledText || null,
							isCancelled: entry.isCancelled
						})
						.returning();

					// Insert anime season associations if present
					if (entry.anime && entry.anime.length > 0) {
						for (const anime of entry.anime) {
							await tx.insert(schema.scheduleEntryAnimeSeason).values({
								scheduleEntryId: entryRecord.scheduleEntryId,
								animeSeasonId: anime.animeSeasonId,
								episodes: anime.episodes
							});
						}
					}

					// Insert platform associations if present
					if (entry.platforms && entry.platforms.length > 0) {
						for (const platformId of entry.platforms) {
							await tx.insert(schema.scheduleEntryPlatform).values({
								scheduleEntryId: entryRecord.scheduleEntryId,
								platformId
							});
						}
					}
				}
			});

			// Redirect to schedule list or detail page
			return redirect(303, `/admin/schedule`);
		} catch (error) {
			console.error('Failed to create schedule:', error);
			throw new AppError(ERROR_CODES.forms.INTERNAL_ERROR, { cause: error });
		}
	}
};
