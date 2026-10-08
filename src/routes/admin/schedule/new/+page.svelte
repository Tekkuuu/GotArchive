<script lang="ts">
	import type { PageProps } from './$types';
	import { errorMessage } from '$lib/errors';
	import { DAY_NAMES, entryTypeBadge } from '$lib/schemas';
	import { formatTime } from '$lib/util/scheduleEntry';
	import { formatIsoWeekLine } from '$lib/util/dateUtils';
	import { Clock, Edit, Info, Plus, Save, Trash2, TriangleAlert } from 'lucide-svelte';
	import { parseISO } from 'date-fns';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		AddScheduleEntry,
		EditScheduleEntry,
		type EditScheduleEntryData,
		type NewScheduleEntryData
	} from '$lib/components/schedule/new';
	import { modalUtils } from '$lib/components/util';
	import { NoteStyler } from '$lib/components/ui/notestyler';
	import { notification } from '$lib/components/ui/toaster';
	import {
		createSchedule,
		generateScheduleEntries,
		scheduleExists
	} from '$lib/remote/schedule.remote';
	import type { GeneratedEntry } from '$lib/server/schedule/generateEntries';

	let { data }: PageProps = $props();

	type DraftEntry = GeneratedEntry | NewScheduleEntryData;

	// svelte-ignore state_referenced_locally
	let schedule = $state({
		year: data.targetYear,
		week: data.targetWeek,
		note: '',
		preview: true
	});
	let entries = $state<DraftEntry[]>([]);
	let alreadyExists = $state(false);
	let isGenerating = $state(false);
	let isSaving = $state(false);

	let editingEntryIndex = $state<number | null>(null);

	// Remount key.
	let editModalKey = $state(0);

	const editingEntry = $derived(editingEntryIndex !== null ? entries[editingEntryIndex] : null);
	const totalEntries = $derived(entries.length);

	const weekDateLabel = $derived.by(() => {
		const { year, week } = schedule;
		if (!Number.isInteger(year) || !Number.isInteger(week) || week < 1 || week > 53) return '';
		try {
			return formatIsoWeekLine(year, week);
		} catch {
			return '';
		}
	});

	const canSubmit = $derived(totalEntries > 0 && !alreadyExists && !isSaving && !isGenerating);

	const entriesByWeekday = $derived.by(() => {
		const groups = new Map<number, Array<{ entry: (typeof entries)[number]; index: number }>>();

		entries.forEach((entry, index) => {
			try {
				const date = parseISO(entry.date);
				const day = date.getDay();
				const adjustedDay = day === 0 ? 6 : day - 1;

				if (!groups.has(adjustedDay)) {
					groups.set(adjustedDay, []);
				}
				groups.get(adjustedDay)!.push({ entry, index });
			} catch {
				// Skip invalid date.
			}
		});

		groups.forEach((dayEntries) => {
			dayEntries.sort((a, b) => {
				const timeA = a.entry.time || '';
				const timeB = b.entry.time || '';
				return timeA.localeCompare(timeB);
			});
		});

		return groups;
	});

	const weekdayNames = DAY_NAMES;

	function openEditModal(index: number) {
		editingEntryIndex = index;
		editModalKey++;
		modalUtils.openModal('edit-schedule-entry-modal');
	}

	function handleEditSave(updatedData: EditScheduleEntryData) {
		if (editingEntryIndex === null) return;

		const currentEntry = entries[editingEntryIndex];
		entries[editingEntryIndex] = {
			...currentEntry,
			time: updatedData.time,
			note: updatedData.note,
			logoUrl: updatedData.logoUrl,
			title: updatedData.title,
			description: updatedData.description,
			cancelledText: updatedData.cancelledText,
			isCancelled: updatedData.isCancelled,
			anime: updatedData.anime,
			platforms: updatedData.platforms
		};

		editingEntryIndex = null;
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

	function handleAddEntry(newEntry: NewScheduleEntryData) {
		entries = [...entries, newEntry];
	}

	function removeEntry(index: number) {
		entries = entries.filter((_, i) => i !== index);
	}

	async function validateScheduleDate() {
		const { year, week } = schedule;
		if (!Number.isInteger(year) || !Number.isInteger(week) || week < 1 || week > 53) return;

		isGenerating = true;
		try {
			const [exists, generated] = await Promise.all([
				scheduleExists({ year, week }),
				generateScheduleEntries({ year, week })
			]);

			alreadyExists = exists;
			if (exists) {
				notification.info(
					'A schedule for this year and week already exists. Choose a different week.'
				);
			}

			entries = generated.entries;
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to generate schedule entries'));
		} finally {
			isGenerating = false;
		}
	}

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (entries.length === 0) {
			notification.error('Schedule must have at least one entry.');
			return;
		}

		isSaving = true;
		try {
			await createSchedule({
				schedule: {
					year: schedule.year,
					week: schedule.week,
					note: schedule.note || null,
					preview: schedule.preview
				},
				entries
			});

			notification.success('Schedule created successfully');
			await goto('/admin/schedule');
		} catch (err) {
			notification.error(errorMessage(err, 'Failed to create schedule'));
		} finally {
			isSaving = false;
		}
	}

	onMount(() => {
		validateScheduleDate();
	});
</script>

<svelte:head>
	<title>New Schedule | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-7xl space-y-4 p-2 md:p-4">
	<!-- Header -->
	<div>
		<h1 class="text-center text-2xl font-bold md:text-3xl">New Schedule</h1>
		{#if weekDateLabel}
			<p class="text-base-content/70 mt-1 text-center">{weekDateLabel}</p>
		{/if}
	</div>

	<form onsubmit={handleSubmit} class="space-y-4">
		<!-- Schedule info -->
		<section class="card bg-base-200 shadow-md">
			<div class="card-body p-4 sm:p-5">
				<h2 class="card-title mb-3 text-lg">Schedule Info</h2>

				<div class="grid grid-cols-2 gap-3">
					<fieldset class="fieldset">
						<legend class="fieldset-legend">Year</legend>
						<input
							type="number"
							bind:value={schedule.year}
							min={1900}
							max={2100}
							class="input input-bordered w-full"
							onchange={validateScheduleDate}
						/>
					</fieldset>
					<fieldset class="fieldset">
						<legend class="fieldset-legend">Week</legend>
						<input
							type="number"
							bind:value={schedule.week}
							min={1}
							max={53}
							class="input input-bordered w-full"
							onchange={validateScheduleDate}
						/>
					</fieldset>
				</div>

				{#if alreadyExists}
					<div role="alert" class="alert alert-warning mt-3">
						<TriangleAlert class="size-5 shrink-0" />
						<span class="text-sm">
							A schedule for {schedule.year} week {schedule.week} already exists. Pick a different week
							before saving.
						</span>
					</div>
				{/if}

				<div class="divider my-3">Visibility</div>

				<div
					class="grid grid-cols-1 gap-2 sm:grid-cols-2"
					role="radiogroup"
					aria-label="Visibility"
				>
					<label
						class={[
							'rounded-box flex cursor-pointer items-center gap-3 border p-3 transition-colors',
							schedule.preview
								? 'border-warning bg-warning/10'
								: 'border-base-content/15 bg-base-100 hover:border-base-content/30'
						]}
					>
						<input
							type="radio"
							name="visibility"
							class="radio radio-warning"
							checked={schedule.preview}
							onchange={() => (schedule.preview = true)}
						/>
						<span>
							<span class="font-semibold">Draft</span>
							<span class="text-base-content/70 block text-sm">Hidden from public</span>
						</span>
					</label>
					<label
						class={[
							'rounded-box flex cursor-pointer items-center gap-3 border p-3 transition-colors',
							!schedule.preview
								? 'border-success bg-success/10'
								: 'border-base-content/15 bg-base-100 hover:border-base-content/30'
						]}
					>
						<input
							type="radio"
							name="visibility"
							class="radio radio-success"
							checked={!schedule.preview}
							onchange={() => (schedule.preview = false)}
						/>
						<span>
							<span class="font-semibold">Published</span>
							<span class="text-base-content/70 block text-sm">Publicly visible</span>
						</span>
					</label>
				</div>
			</div>
		</section>

		<!-- Note -->
		<section class="card bg-base-200 shadow-md">
			<div class="card-body p-4 sm:p-5">
				<h2 class="card-title mb-3 text-lg">Note</h2>
				<NoteStyler bind:content={schedule.note} week={schedule.week} year={schedule.year} />
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

				{#if isGenerating}
					<div class="flex items-center justify-center gap-2 py-8">
						<span class="loading loading-spinner loading-md" aria-hidden="true"></span>
						<span class="text-base-content/70 text-sm">Generating entries from slots&hellip;</span>
					</div>
				{:else if entries.length === 0}
					<div
						class="rounded-box border-base-content/20 bg-base-300/30 text-base-content/60 flex items-center gap-2 border border-dashed p-4"
					>
						<Info class="size-5 shrink-0" />
						<span
							>No entries generated. Create active schedule slots first or add entries manually.</span
						>
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
										{#each dayEntries as { entry, index }}
											<li
												class="list-row hover:bg-base-300 last:rounded-box items-center justify-center rounded-none last:rounded-t-none"
											>
												<!-- Summary -->
												<div class="flex items-center gap-2">
													<Clock class="size-4" />
													<span>{formatTime(entry.time)}</span>
												</div>
												<div class="badge {getTypeColor(entry.type)}">{entry.type}</div>
												{#if entry.anime && entry.anime.length > 0}
													<div class="list-col-grow flex flex-col gap-0">
														{#each formatAnimeInfo(entry.anime) as animeInfo}
															<span class="text-sm font-medium">
																{animeInfo.seasonTitle}
																<span class="opacity-70">E{animeInfo.episodes}</span>
															</span>
														{/each}
													</div>
												{:else if entry.title}
													<span class="list-col-grow truncate text-sm font-medium"
														>{entry.title}</span
													>
												{/if}
												<div class="flex gap-2">
													<button
														type="button"
														class="btn btn-sm btn-square btn-neutral"
														onclick={() => openEditModal(index)}
													>
														<Edit class="size-4" />
													</button>
													<button
														type="button"
														class="btn btn-sm btn-square btn-error"
														onclick={() => removeEntry(index)}
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

		<!-- Actions -->
		<div
			class="bg-base-200 rounded-box sticky bottom-2 flex flex-wrap items-center gap-2 p-3 shadow-md"
		>
			<a href="/admin/schedule" class="btn btn-ghost"> Cancel </a>
			<button
				class="btn btn-success ml-auto grow sm:grow-0 sm:px-8"
				type="submit"
				disabled={!canSubmit}
			>
				{#if isSaving}
					<span class="loading loading-spinner loading-sm" aria-hidden="true"></span>
					Creating&hellip;
				{:else}
					<Save class="size-4" />
					Create Schedule
				{/if}
			</button>
		</div>
	</form>
</div>

<!-- Add -->
<AddScheduleEntry
	id="add-schedule-entry-modal"
	availableSeasons={data.animeSeasons}
	availablePlatforms={data.platforms}
	onAdd={handleAddEntry}
	year={schedule.year}
	week={schedule.week}
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
