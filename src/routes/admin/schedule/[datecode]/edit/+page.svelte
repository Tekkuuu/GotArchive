<script lang="ts">
	import type { PageProps } from './$types';
	import { errorMessage } from '$lib/errors';
	import { DAY_NAMES, entryTypeBadge } from '$lib/schemas';
	import { formatTime } from '$lib/util/scheduleEntry';
	import { formatIsoWeekLine } from '$lib/util/dateUtils';
	import { AlertCircle, ArrowLeft, Clock, Edit, Info, Plus, Trash2 } from 'lucide-svelte';
	import { parseISO } from 'date-fns';
	import { invalidateAll } from '$app/navigation';
	import { tick } from 'svelte';
	import {
		AddScheduleEntry,
		EditScheduleEntry,
		type EditScheduleEntryData,
		type NewScheduleEntryData
	} from '$lib/components/schedule/new';
	import { modalUtils } from '$lib/components/util';
	import { notification } from '$lib/components/ui/toaster';
	import {
		addScheduleEntry,
		deleteScheduleEntry,
		toggleCancelled,
		togglePreview,
		updateScheduleEntry,
		updateScheduleMetadata
	} from '$lib/remote/schedule.remote';
	import { NoteStyler } from '$lib/components/ui/notestyler';

	let { data }: PageProps = $props();

	type EntryDraft = EditScheduleEntryData & { scheduleEntryId: string };

	// svelte-ignore state_referenced_locally
	let note = $state(data.schedule.note ?? '');
	// svelte-ignore state_referenced_locally
	let preview = $state(data.schedule.preview);
	// svelte-ignore state_referenced_locally
	let savedNote = $state(data.schedule.note ?? '');
	let isSavingNote = $state(false);
	let isTogglingPublish = $state(false);

	const isNoteDirty = $derived(note !== savedNote);
	const totalEntries = $derived(data.entries.length);

	const weekDates = $derived(formatIsoWeekLine(data.schedule.year, data.schedule.week));

	let editingEntry = $state<EntryDraft | null>(null);

	// Remount key.
	let editModalKey = $state(0);

	const entriesByWeekday = $derived.by(() => {
		const groups = new Map<
			number,
			Array<{ entry: (typeof data.entries)[number]; index: number }>
		>();

		data.entries.forEach((entryData, index) => {
			const entry = entryData.entry;
			try {
				const date = parseISO(entry.date);
				const day = date.getDay();
				const adjustedDay = day === 0 ? 6 : day - 1;

				if (!groups.has(adjustedDay)) {
					groups.set(adjustedDay, []);
				}
				groups.get(adjustedDay)!.push({ entry: entryData, index });
			} catch {
				// Skip invalid date.
			}
		});

		groups.forEach((dayEntries) => {
			dayEntries.sort((a, b) => {
				const timeA = a.entry.entry.time || '';
				const timeB = b.entry.entry.time || '';
				return timeA.localeCompare(timeB);
			});
		});

		return groups;
	});

	const weekdayNames = DAY_NAMES;

	async function openEditModal(entryData: (typeof data.entries)[number]) {
		const entry = entryData.entry;
		editingEntry = {
			scheduleEntryId: entry.scheduleEntryId,
			date: entry.date,
			type: entry.type,
			time: entry.time,
			note: entry.note,
			logoUrl: entry.logoUrl,
			title: entry.title,
			description: entry.description,
			cancelledText: entry.cancelledText,
			isCancelled: entry.isCancelled,
			anime: entryData.animeSeasons,
			platforms: entryData.platforms
		};
		editModalKey++;
		await tick();
		modalUtils.openModal('edit-schedule-entry-modal');
	}

	async function saveNote() {
		if (!isNoteDirty || isSavingNote) return;
		isSavingNote = true;
		try {
			await updateScheduleMetadata({
				scheduleId: data.schedule.scheduleId,
				note: note || null,
				preview
			});
			savedNote = note;
			notification.success('Note saved');
			await invalidateAll();
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to save note'));
		} finally {
			isSavingNote = false;
		}
	}

	async function handleTogglePublish() {
		if (isTogglingPublish) return;
		const next = !preview;
		if (
			!window.confirm(
				`Are you sure you want to ${preview ? 'publish' : 'unpublish'} this schedule?`
			)
		) {
			return;
		}
		isTogglingPublish = true;
		try {
			await togglePreview({ scheduleId: data.schedule.scheduleId, preview: next });
			preview = next;
			notification.success(next ? 'Schedule unpublished' : 'Schedule published');
			await invalidateAll();
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to update visibility'));
		} finally {
			isTogglingPublish = false;
		}
	}

	async function handleAddEntry(newEntry: NewScheduleEntryData) {
		try {
			await addScheduleEntry({ scheduleId: data.schedule.scheduleId, ...newEntry });
			notification.success('Entry added');
			await invalidateAll();
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to add entry'));
		}
	}

	async function handleEditSave(updatedData: EditScheduleEntryData) {
		if (!editingEntry) return;

		try {
			await updateScheduleEntry({
				scheduleEntryId: editingEntry.scheduleEntryId,
				date: updatedData.date,
				time: updatedData.time,
				note: updatedData.note,
				logoUrl: updatedData.logoUrl,
				title: updatedData.title,
				description: updatedData.description,
				cancelledText: updatedData.cancelledText,
				isCancelled: updatedData.isCancelled,
				anime: updatedData.anime,
				platforms: updatedData.platforms
			});
			notification.success('Entry updated');
			await invalidateAll();
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to update entry'));
		}
	}

	async function handleDeleteEntry(scheduleEntryId: string) {
		if (!window.confirm('Are you sure you want to delete this entry?')) return;

		try {
			await deleteScheduleEntry({ scheduleEntryId });
			notification.success('Entry deleted');
			await invalidateAll();
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to delete entry'));
		}
	}

	async function handleToggleCancelled(scheduleEntryId: string, isCancelled: boolean) {
		if (
			!window.confirm(`Are you sure you want to ${isCancelled ? 'uncancel' : 'cancel'} this entry?`)
		) {
			return;
		}

		try {
			await toggleCancelled({ scheduleEntryId, isCancelled: !isCancelled });
			notification.success(isCancelled ? 'Entry uncancelled' : 'Entry cancelled');
			await invalidateAll();
		} catch {
			notification.error('Failed to update entry');
		}
	}

	function getSeasonInfo(seasonId: string | null) {
		if (!seasonId) return null;

		const season = data.animeSeasons.find((s) => s.animeSeasonId === seasonId);
		return season
			? {
					title:
						season.shortTitle || season.titleEnglish || season.titleRomaji || season.titleNative,
					maxEpisodes: season.episodes
				}
			: null;
	}

	function getTypeColor(type: string): string {
		return entryTypeBadge(type);
	}

	function formatAnimeInfo(
		animeList: Array<{ animeSeasonId: string; episodes: string }> | null | undefined
	): Array<{ seasonTitle: string; episodes: string }> {
		if (!animeList || animeList.length === 0) return [];

		return animeList.map((anime) => {
			const seasonInfo = getSeasonInfo(anime.animeSeasonId);
			return {
				seasonTitle: seasonInfo?.title || 'Unknown',
				episodes: anime.episodes
			};
		});
	}
</script>

<svelte:head>
	<title>Edit Schedule | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-7xl space-y-4 p-2 md:p-4">
	<!-- Header -->
	<div>
		<h1 class="text-center text-2xl font-bold md:text-3xl">Edit Schedule</h1>
		<p class="text-base-content/70 mt-1 text-center">
			{weekDates}, week {data.schedule.week}
		</p>
	</div>

	<!-- Publication -->
	<section class="card bg-base-200 shadow-md">
		<div class="card-body flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
			<div>
				<h2 class="card-title text-lg">Visibility</h2>
				<p class="text-base-content/70 text-sm">
					{preview ? 'Hidden from public' : 'Publicly visible'}
				</p>
			</div>
			<button
				type="button"
				class={['btn shrink-0', preview ? 'btn-success' : 'btn-warning']}
				disabled={isTogglingPublish}
				onclick={handleTogglePublish}
			>
				{#if isTogglingPublish}
					<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
					Saving&hellip;
				{:else if preview}
					Publish
				{:else}
					Unpublish
				{/if}
			</button>
		</div>
	</section>

	<!-- Note -->
	<section class="card bg-base-200 shadow-md">
		<div class="card-body p-4 sm:p-5">
			<h2 class="card-title mb-3 text-lg">Note</h2>
			<NoteStyler bind:content={note} week={data.schedule.week} year={data.schedule.year} />
			<button
				type="button"
				class="btn btn-success mt-3 w-full"
				disabled={!isNoteDirty || isSavingNote}
				onclick={saveNote}
			>
				{#if isSavingNote}
					<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
					Saving&hellip;
				{:else}
					Save Note
				{/if}
			</button>
		</div>
	</section>

	<!-- Entries -->
	<section class="card bg-base-200 shadow-md">
		<div class="card-body p-4 sm:p-5">
			<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
				<h2 class="card-title text-lg">
					Schedule Entries
					<span class="badge badge-ghost">{totalEntries}</span>
				</h2>
				<button
					type="button"
					class="btn btn-primary btn-sm"
					onclick={() => modalUtils.openModal('add-schedule-entry-modal')}
				>
					<Plus class="size-4" />
					Add Entry
				</button>
			</div>

			{#if data.entries.length === 0}
				<div
					class="rounded-box border-base-content/20 bg-base-300/30 text-base-content/60 flex items-center gap-2 border border-dashed p-4"
				>
					<Info class="size-5 shrink-0" />
					<span>No entries in this schedule. Add entries to get started.</span>
				</div>
			{:else}
				<!-- Days -->
				<div class="space-y-2">
					{#each Array.from(entriesByWeekday.entries()).sort((a, b) => a[0] - b[0]) as [dayIndex, dayEntries]}
						<div class="card bg-base-100">
							<div class="card-body group gap-0 p-0">
								<div
									class={[
										'transition-color rounded-box flex items-center justify-between rounded-b-none p-2 duration-150',
										'bg-primary/15 text-base-content',
										'group-hover:bg-primary group-hover:text-primary-content'
									]}
								>
									<span class="text-xl font-bold">{weekdayNames[dayIndex]}</span>
									<div class="badge badge-ghost">{dayEntries.length} entrie(s)</div>
								</div>
								<ul class="list rounded-box rounded-t-none">
									{#each dayEntries as { entry: entryData }}
										{@const entry = entryData.entry}
										<li
											class="list-row hover:bg-base-300 last:rounded-box relative items-center justify-center rounded-none last:rounded-t-none"
										>
											<!-- Summary -->
											<div class="flex items-center gap-2">
												<Clock class="size-4" />
												<span>{formatTime(entry.time)}</span>
											</div>
											<div class="badge {getTypeColor(entry.type)}">{entry.type}</div>
											{#if entryData.animeSeasons && entryData.animeSeasons.length > 0}
												<div class="list-col-grow flex flex-col gap-0">
													{#each formatAnimeInfo(entryData.animeSeasons) as animeInfo}
														<span class="text-sm font-medium">
															{animeInfo.seasonTitle}
															<span class="opacity-70">E{animeInfo.episodes}</span>
														</span>
													{/each}
												</div>
											{:else if entry.title}
												<span class="list-col-grow truncate text-sm font-medium">{entry.title}</span
												>
											{/if}
											<div class="flex gap-2">
												<button
													type="button"
													class="btn btn-sm btn-square {entry.isCancelled
														? 'btn-warning'
														: 'btn-ghost'}"
													title={entry.isCancelled ? 'Uncancel' : 'Cancel'}
													onclick={() =>
														handleToggleCancelled(entry.scheduleEntryId, entry.isCancelled)}
												>
													<AlertCircle class="size-4" />
												</button>

												<button
													type="button"
													class="btn btn-sm btn-square btn-neutral"
													onclick={() => openEditModal(entryData)}
												>
													<Edit class="size-4" />
												</button>

												<button
													type="button"
													class="btn btn-sm btn-square btn-error"
													onclick={() => handleDeleteEntry(entry.scheduleEntryId)}
												>
													<Trash2 class="size-4" />
												</button>
											</div>
										</li>
									{/each}
								</ul>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>

	<!-- Back -->
	<a href="/admin/schedule" class="btn btn-primary w-full">
		<ArrowLeft class="size-4" />
		Back to Schedules
	</a>
</div>

<!-- Add -->
<AddScheduleEntry
	id="add-schedule-entry-modal"
	availableSeasons={data.animeSeasons}
	availablePlatforms={data.platforms}
	onAdd={handleAddEntry}
	year={data.schedule.year}
	week={data.schedule.week}
/>

<!-- Edit -->
{#key editModalKey}
	<EditScheduleEntry
		id="edit-schedule-entry-modal"
		availableSeasons={data.animeSeasons}
		availablePlatforms={data.platforms}
		entryData={editingEntry}
		onSave={handleEditSave}
	/>
{/key}
