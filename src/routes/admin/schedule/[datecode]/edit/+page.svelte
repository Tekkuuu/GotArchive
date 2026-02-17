<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import {
		Calendar,
		Clock,
		Film,
		Info,
		Save,
		Trash2,
		Plus,
		Edit,
		X,
		AlertCircle
	} from 'lucide-svelte';
	import { format, parseISO } from 'date-fns';
	import { AddScheduleEntry, EditScheduleEntry, type EditScheduleEntryData, type NewScheduleEntryData } from '$lib/components/schedule/new';
	import { modalUtils } from '$lib/components/util';
	import { enhance as defaultEnhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
  let { form: metadataForm, enhance: metadataEnhance } = superForm(data.metadataForm, {
		dataType: 'json',
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: async ({ result }) => {
			if (result.type === 'redirect') {
				// Will be handled by SvelteKit
			} else if (result.type === 'success') {
				await invalidateAll();
			}
		}
	});

	// Track which entry is being edited
	let editingEntryIndex = $state<number | null>(null);
	let editingEntry = $state<any | null>(null);

	// Group entries by weekday
	const entriesByWeekday = $derived.by(() => {
		const groups = new Map<
			number,
			Array<{ entry: (typeof data.entries)[number]; index: number }>
		>();

    console.log("Data", data.entries)

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
				// Invalid date, skip
			}
		});

		// Sort entries within each day by time
		groups.forEach((entries) => {
			entries.sort((a, b) => {
				const timeA = a.entry.entry.time || '';
				const timeB = b.entry.entry.time || '';
				return timeA.localeCompare(timeB);
			});
		});

		return groups;
	});

	const weekdayNames = [
		'Monday',
		'Tuesday',
		'Wednesday',
		'Thursday',
		'Friday',
		'Saturday',
		'Sunday'
	];

	function openEditModal(entryData: typeof data.entries[number], index: number) {
		const entry = entryData.entry;
		editingEntryIndex = index;
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
		modalUtils.openModal('edit-schedule-entry-modal');
	}

	async function handleEditSave(updatedData: EditScheduleEntryData) {
		if (editingEntry === null) return;

		const formData = new FormData();
		formData.append('scheduleEntryId', editingEntry.scheduleEntryId);
		formData.append('time', updatedData.time || '');
		formData.append('title', updatedData.title || '');
		formData.append('description', updatedData.description || '');
		formData.append('logoUrl', updatedData.logoUrl || '');
		formData.append('note', updatedData.note || '');
		formData.append('cancelledText', updatedData.cancelledText || '');
		formData.append('isCancelled', String(updatedData.isCancelled));
		formData.append('anime', JSON.stringify(updatedData.anime));
		formData.append('platforms', JSON.stringify(updatedData.platforms));

		const response = await fetch('?/updateEntry', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			await invalidateAll();
			editingEntryIndex = null;
			editingEntry = null;
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

	function formatTime(timeStr: string | null): string {
		if (!timeStr) return 'No time';
		try {
			return format(new Date(`1970-01-01T${timeStr}`), 'HH:mm');
		} catch {
			return timeStr;
		}
	}

	function getTypeColor(type: string): string {
		const colors: Record<string, string> = {
			anime: 'badge-primary',
			hololive: 'badge-secondary',
			game: 'badge-accent',
			event: 'badge-info',
			sponsored: 'badge-warning',
			misc: 'badge-ghost'
		};
		return colors[type] || 'badge-ghost';
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

	async function handleAddEntry(newEntry: NewScheduleEntryData) {
		const formData = new FormData();
		formData.append('date', newEntry.date);
		formData.append('type', newEntry.type);
		formData.append('time', newEntry.time || '');
		formData.append('title', newEntry.title || '');
		formData.append('description', newEntry.description || '');
		formData.append('logoUrl', newEntry.logoUrl || '');
		formData.append('note', newEntry.note || '');
		formData.append('cancelledText', newEntry.cancelledText || '');
		formData.append('isCancelled', String(newEntry.isCancelled));
		formData.append('anime', JSON.stringify(newEntry.anime));
		formData.append('platforms', JSON.stringify(newEntry.platforms));

		const response = await fetch('?/addEntry', {
			method: 'POST',
			body: formData
		});

		if (response.ok) {
			await invalidateAll();
		} else {
			const result = await response.json();
			alert(result.error || 'Failed to add entry');
		}
	}

	function handleDeleteEntry(scheduleEntryId: string) {
		if (!window.confirm('Are you sure you want to delete this entry?')) {
			return;
		}

		const form = document.getElementById(`delete-entry-${scheduleEntryId}`) as HTMLFormElement;
		form?.requestSubmit();
	}

	function handleToggleCancelled(scheduleEntryId: string, currentCancelled: boolean) {
		if (!window.confirm(`Are you sure you want to ${currentCancelled ? 'uncancel' : 'cancel'} this entry?`)) {
			return;
		}

		const form = document.getElementById(`toggle-cancelled-${scheduleEntryId}`) as HTMLFormElement;
		form?.requestSubmit();
	}
</script>

<svelte:head>
	<title>Edit Schedule | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-7xl p-2 md:p-4">
	<!-- Page Header -->
	<div class="mb-4">
		<h1 class="text-2xl md:text-3xl font-bold text-center">Edit Schedule</h1>
		<p class="text-base-content/70 mt-2 text-center">
			Year {data.schedule.year}, Week {data.schedule.week}
		</p>
	</div>

	<!-- Schedule Metadata Card -->
	<form method="POST" action="?/updateMetadata" use:metadataEnhance class="mb-4">
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4">
				<h2 class="card-title text-lg mb-2">
					<Calendar class="h-5 w-5" />
					Schedule Info
				</h2>

				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
					<label class="input w-full">
						<span class="label">Year</span>
						<input
							type="number"
							bind:value={$metadataForm.year}
							min={1900}
							max={2100}
							class="w-full"
						/>
					</label>
					<label class="input w-full">
						<span class="label">Week</span>
						<input
							type="number"
							bind:value={$metadataForm.week}
							min={1}
							max={53}
							class="w-full"
						/>
					</label>
					<label class="input w-full">
						<span class="label">Note</span>
						<input
							type="text"
							bind:value={() => $metadataForm.note || '', (v) => ($metadataForm.note = v || undefined)}
							placeholder="Any notes..."
							class="w-full"
						/>
					</label>
				</div>

				<button type="submit" class="btn btn-success mt-2">
					<Save class="h-4 w-4" />
					Save Metadata
				</button>
			</div>
		</div>
	</form>

	<!-- Entries by Weekday -->
	<div class="card bg-base-200 shadow-md">
		<div class="card-body p-4">
			<div class="flex items-center justify-between mb-2">
				<h2 class="card-title text-lg">
					<Film />
					Schedule Entries
				</h2>
				<div class="flex items-center gap-2">
					<button
						type="button"
						class="btn btn-primary"
						onclick={() => modalUtils.openModal('add-schedule-entry-modal')}
					>
						<Plus />
						Add Entry
					</button>
				</div>
			</div>

			{#if data.entries.length === 0}
				<div
					class="border border-dashed rounded-box p-4 border-base-content/20 bg-base-300/30 text-base-content/60 gap-2 flex items-center"
				>
					<Info class="h-5 w-5" />
					<span>No entries in this schedule. Add entries to get started.</span>
				</div>
			{:else}
				<!-- Weekday Accordions -->
				<div class="space-y-2">
					{#each Array.from(entriesByWeekday.entries()).sort((a, b) => a[0] - b[0]) as [dayIndex, dayEntries]}
						<div class="card bg-base-100">
							<div class="card-body gap-0 p-0 group">
								<div
									class={[
										'transition-color duration-150 rounded-box rounded-b-none p-2 flex justify-between items-center',
										'bg-primary/15 text-base-content',
										'group-hover:bg-primary group-hover:text-primary-content'
									]}
								>
									<span class="font-bold text-xl">{weekdayNames[dayIndex]}</span>
									<div class="badge badge-ghost">{dayEntries.length} entrie(s)</div>
								</div>
								<ul class="list rounded-box rounded-t-none">
									{#each dayEntries as { entry: entryData, index }}
										{@const entry = entryData.entry}
										<li
											class="list-row items-center justify-center hover:bg-base-300 rounded-none last:rounded-box last:rounded-t-none relative"
										>
											<!-- Cancelled indicator -->
											{#if entry.isCancelled}
												<div class="absolute left-1 top-1/2 -translate-y-1/2">
													<span class="relative flex h-3 w-3">
														<span
															class="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"
														></span>
														<span class="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
													</span>
												</div>
											{/if}

											<!-- Entry Summary -->
											<div class="flex items-center gap-2 {entry.isCancelled ? 'ml-4' : ''}">
												<Clock />
												<span>{formatTime(entry.time)}</span>
											</div>
											<div class="badge {getTypeColor(entry.type)}">{entry.type}</div>
											{#if entryData.animeSeasons && entryData.animeSeasons.length > 0}
                        {console.log(entryData)}
												<div class="flex flex-col gap-0 list-col-grow">
													{#each formatAnimeInfo(entryData.animeSeasons) as animeInfo}
														<span class="text-sm font-medium">
															{animeInfo.seasonTitle}
															<span class="opacity-70">E{animeInfo.episodes}</span>
														</span>
													{/each}
												</div>
											{:else if entry.title}
												<span class="text-sm list-col-grow font-medium truncate">{entry.title}</span>
											{/if}
											<div class="flex gap-2">
												<!-- Toggle Cancelled -->
												<form
													id="toggle-cancelled-{entry.scheduleEntryId}"
													method="POST"
													action="?/updateEntry"
													use:defaultEnhance={() => {
														return async ({ update }) => {
															await update();
															await invalidateAll();
														};
													}}
												>
													<input type="hidden" name="scheduleEntryId" value={entry.scheduleEntryId} />
													<input type="hidden" name="time" value={entry.time || ''} />
													<input type="hidden" name="title" value={entry.title || ''} />
													<input type="hidden" name="description" value={entry.description || ''} />
													<input type="hidden" name="logoUrl" value={entry.logoUrl || ''} />
													<input type="hidden" name="note" value={entry.note || ''} />
													<input type="hidden" name="cancelledText" value={entry.cancelledText || ''} />
													<input type="hidden" name="isCancelled" value={!entry.isCancelled} />
													<input type="hidden" name="anime" value={JSON.stringify(entryData.animeSeasons)} />
													<button
														type="button"
														class="btn btn-sm btn-square {entry.isCancelled ? 'btn-warning' : 'btn-ghost'}"
														title={entry.isCancelled ? 'Uncancel' : 'Cancel'}
														onclick={() => handleToggleCancelled(entry.scheduleEntryId, entry.isCancelled)}
													>
														<AlertCircle class="size-4" />
													</button>
												</form>

												<!-- Edit -->
												<button
													type="button"
													class="btn btn-sm btn-square btn-neutral"
													onclick={() => openEditModal(entryData, index)}
												>
													<Edit class="size-4" />
												</button>

												<!-- Delete -->
												<form
													id="delete-entry-{entry.scheduleEntryId}"
													method="POST"
													action="?/deleteEntry"
													use:defaultEnhance={() => {
														return async ({ update }) => {
															await update();
															await invalidateAll();
														};
													}}
												>
													<input type="hidden" name="scheduleEntryId" value={entry.scheduleEntryId} />
													<button
														type="button"
														class="btn btn-sm btn-square btn-error"
														onclick={() => handleDeleteEntry(entry.scheduleEntryId)}
													>
														<Trash2 class="size-4" />
													</button>
												</form>
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
	</div>

	<!-- Back Button -->
	<a href="/admin/schedule" class="btn btn-ghost w-full mt-4">
		<X class="h-4 w-4" />
		Back to Schedules
	</a>
</div>

<!-- Add Entry Modal -->
<AddScheduleEntry
	id="add-schedule-entry-modal"
	availableSeasons={data.animeSeasons}
	availablePlatforms={data.platforms}
	onAdd={handleAddEntry}
	year={data.schedule.year}
	week={data.schedule.week}
/>

<!-- Edit Entry Modal -->
<EditScheduleEntry
	id="edit-schedule-entry-modal"
	availableSeasons={data.animeSeasons}
	availablePlatforms={data.platforms}
	entryData={editingEntry}
	onSave={handleEditSave}
/>
