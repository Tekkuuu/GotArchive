<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
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
		Eye,
		EyeOff
	} from 'lucide-svelte';
	import { format, parseISO } from 'date-fns';
	import { AddScheduleEntry, EditScheduleEntry, type EditScheduleEntryData, type NewScheduleEntryData } from '$lib/components/schedule/new';
	import { modalUtils } from '$lib/components/util';
	import { enhance as defaultEnhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { notification } from '$lib/components/ui/toaster';
	import { AddScheduleEntrySchema, EditScheduleSchema } from '$lib/schemas';
	import ToggleCancelledButton from '$lib/components/schedule/ToggleCancelledButton.svelte';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	let { form: scheduleForm, enhance: scheduleEnhance, submit: scheduleSubmit } = superForm(data.scheduleForm, {
		dataType: 'json',
    validators: zod4Client(EditScheduleSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: async ({ result }) => {
      if (result.type === 'success') {
				notification.success('Schedule updated');
			} else if (result.type === 'failure') {
				notification.error(result.data?.error || 'Failed to update');
			} else if (result.type === 'error') {
        console.error('Error updating schedule:', result.error);
        notification.error('An unexpected error occurred');
			}
		}
	});

	// svelte-ignore state_referenced_locally
	const { form: addEntryForm, enhance: addEntryEnhance, submit: submitAddEntry } = superForm(data.addEntryForm, {
		dataType: 'json',
		validators: zod4Client(AddScheduleEntrySchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: async ({ result }) => {
			if (result.type === 'success') {
        notification.success('Entry added');
			} else if (result.type === 'failure') {
				notification.error(result.data?.error || 'Failed to add entry');
			}
		}
	});

  // svelte-ignore state_referenced_locally
  const { form: editEntryForm, enhance: editEntryEnhance, submit: submitEditEntry } = superForm(data.editEntryForm,
  {
    dataType: 'json',
    validators: zod4Client(EditScheduleSchema),
    validationMethod: 'onsubmit',
    multipleSubmits: 'prevent',
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        notification.success('Entry updated');
      } else if (result.type === 'failure') {
        notification.error(result.data?.error || 'Failed to update entry');
      }
    }
  });

	// Track which entry is being edited
	let editingEntry = $state<any | null>(null);

	// Group entries by weekday
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

	function openEditModal(entryData: typeof data.entries[number]) {
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
		modalUtils.openModal('edit-schedule-entry-modal');
	}

	function handleAddEntry(newEntry: NewScheduleEntryData) {
		$addEntryForm = {
			type: newEntry.type,
			date: newEntry.date,
			time: newEntry.time,
			note: newEntry.note,
			logoUrl: newEntry.logoUrl,
			title: newEntry.title,
			description: newEntry.description,
			cancelledText: newEntry.cancelledText,
			isCancelled: newEntry.isCancelled,
			anime: newEntry.anime,
			platforms: newEntry.platforms,
			slotId: null
		};
		submitAddEntry();
	}

	function handleEditSave(updatedData: EditScheduleEntryData) {
		if (!editingEntry) return;
		$editEntryForm = {
			scheduleEntryId: editingEntry.scheduleEntryId,
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
		submitEditEntry();
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
</script>

<svelte:head>
	<title>Edit Schedule | G.O.T Archive</title>
</svelte:head>

<!-- Hidden superForms for programmatic add/edit entry submissions -->
<form method="POST" action="?/addEntry" use:addEntryEnhance class="hidden"></form>
<form method="POST" action="?/updateEntry" use:editEntryEnhance class="hidden"></form>

<div class="container mx-auto max-w-7xl p-2 md:p-4">
	<!-- Page Header -->
	<div class="mb-4">
		<h1 class="text-2xl md:text-3xl font-bold text-center">Edit Schedule</h1>
		<p class="text-base-content/70 mt-2 text-center">
			Year {data.schedule.year}, Week {data.schedule.week}
		</p>
	</div>

	<!-- Schedule Card -->
	<form method="POST" action="?/updateSchedule" use:scheduleEnhance class="mb-4">
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4">
				<h2 class="card-title text-lg mb-2">
					<Calendar class="h-5 w-5" />
					Schedule Info
				</h2>

				<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
					<label class="input w-full">
						<span class="label">Year</span>
						<input
							bind:value={data.schedule.year}
							class="w-full"
              disabled
						/>
					</label>
					<label class="input w-full">
						<span class="label">Week</span>
						<input
							bind:value={data.schedule.week}
							class="w-full"
              disabled
						/>
					</label>
					<label class="textarea w-full sm:col-span-2">
            <span class="label">Note</span>
						<textarea
							bind:value={() => $scheduleForm.note || '', (v) => ($scheduleForm.note = v === '' ? null : v)}
							class="w-full"
						></textarea>
					</label>
				</div>

        <div class="flex gap-2">
          <button
            type="button"
            class="btn btn-success grow"
            onclick={() => {
              $scheduleForm.scheduleId = data.schedule.scheduleId;
              scheduleSubmit();
            }}
          >
            <Save class="h-4 w-4" />
            Save Metadata
          </button>
          <button
            type="button"
            class={["btn", $scheduleForm.preview ? 'btn-success' : 'btn-error']}
            onclick={() => $scheduleForm.preview = !$scheduleForm.preview}
          >
            {#if $scheduleForm.preview}
              <Eye />
            {:else}
              <EyeOff />
            {/if}
            Preview
          </button>
        </div>
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
									{#each dayEntries as { entry: entryData }}
										{@const entry = entryData.entry}
										<li
											class="list-row items-center justify-center hover:bg-base-300 rounded-none last:rounded-box last:rounded-t-none relative"
										>
											<!-- Entry Summary -->
											<div class="flex items-center gap-2">
												<Clock />
												<span>{formatTime(entry.time)}</span>
											</div>
											<div class="badge {getTypeColor(entry.type)}">{entry.type}</div>
											{#if entryData.animeSeasons && entryData.animeSeasons.length > 0}
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
												<ToggleCancelledButton
													sForm={data.toggleCancelledForm}
													scheduleEntryId={entry.scheduleEntryId}
													isCancelled={entry.isCancelled}
												/>

												<!-- Edit -->
												<button
													type="button"
													class="btn btn-sm btn-square btn-neutral"
													onclick={() => openEditModal(entryData)}
												>
													<Edit class="size-4" />
												</button>

												<!-- Delete -->
												<form
													method="POST"
													action="?/deleteEntry"
													use:defaultEnhance={() => {
														return async ({ result, update }) => {
															await update();
															await invalidateAll();
															if (result.type === 'success') {
																notification.success('Entry deleted');
															} else if (result.type === 'error' || result.type === 'failure') {
																notification.error('Failed to delete entry');
															}
														};
													}}
												>
													<input type="hidden" name="scheduleEntryId" value={entry.scheduleEntryId} />
													<button
														type="button"
														class="btn btn-sm btn-square btn-error"
														onclick={(e) => {
															if (!window.confirm('Are you sure you want to delete this entry?')) return;
															e.currentTarget.closest('form')?.requestSubmit();
														}}
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
