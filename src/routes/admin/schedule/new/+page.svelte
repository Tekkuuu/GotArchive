<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { ScheduleSchema } from './util';
	import type { PageProps } from './$types';
	import {
		Calendar,
		Clock,
		Film,
		Info,
		Save,
		Eye,
		Trash2,
		Plus,
		Edit
	} from 'lucide-svelte';
	import { format, parseISO } from 'date-fns';
  import { AddScheduleEntry, EditScheduleEntry, type EditScheduleEntryData, type NewScheduleEntryData } from '$lib/components/schedule/new';
	import { modalUtils } from '$lib/components/util';
	import type { GeneratedEntry } from '$lib/server/schedule/generateEntries';

	type APIValidateDateResponse = { exists: boolean | null; message?: string };
	type APIGenerateEntriesResponse = { entries: GeneratedEntry[]; slotsToReset: string[] };
  import { notification } from '$lib/components/ui/toaster';
	import { onMount } from 'svelte';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
		let { form, enhance } = superForm(data.form, {
		dataType: 'json',
		validators: zod4Client(ScheduleSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'failure') {
				notification.error(result.data?.error || 'Failed to create schedule');
			}
		}
	});

	// Track expanded weekdays and entry being edited
	let editingEntryIndex = $state<number | null>(null);

	// Get data for the entry being edited
	const editingEntry = $derived(
		editingEntryIndex !== null ? $form.entries[editingEntryIndex] : null
	);

	// Group entries by weekday
	const entriesByWeekday = $derived.by(() => {
		const groups = new Map<
			number,
			Array<{ entry: (typeof $form.entries)[number]; index: number }>
		>();

		$form.entries.forEach((entry, index) => {
			try {
				const date = parseISO(entry.date);
				const day = date.getDay();
				const adjustedDay = day === 0 ? 6 : day - 1;

				if (!groups.has(adjustedDay)) {
					groups.set(adjustedDay, []);
				}
				groups.get(adjustedDay)!.push({ entry, index });
			} catch {
				// Invalid date, skip
			}
		});

		// Sort entries within each day by time
		groups.forEach((entries) => {
			entries.sort((a, b) => {
				const timeA = a.entry.time || '';
				const timeB = b.entry.time || '';
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

	function openEditModal(index: number) {
		editingEntryIndex = index;
		modalUtils.openModal('edit-schedule-entry-modal');
	}

	function handleEditSave(updatedData: EditScheduleEntryData) {
		if (editingEntryIndex !== null) {
			const currentEntry = $form.entries[editingEntryIndex];
			$form.entries[editingEntryIndex] = {
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
		}
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

	function handleAddEntry(newEntry: NewScheduleEntryData) {
		$form.entries = [...$form.entries, newEntry];
	}

	function removeEntry(index: number) {
		$form.entries = $form.entries.filter((_, i) => i !== index);
	}

  async function validateScheduleDate() {
    const year = $form.schedule.year;
    const week = $form.schedule.week;

    const [existsResponse, generateResponse] = await Promise.all([
      fetch('/api/schedule/exists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, week })
      }),
      fetch(`/api/schedule/generate?year=${year}&week=${week}`)
    ]);

    if (existsResponse.ok) {
      const existsData: APIValidateDateResponse = await existsResponse.json();
      if (existsData.exists) {
        notification.info("A schedule for this year and week already exists. Creating it won't be possible");
      }
    }

    if (generateResponse.ok) {
      const generateData: APIGenerateEntriesResponse = await generateResponse.json();
      $form.entries = generateData.entries;
      $form.slotsToReset = generateData.slotsToReset;
    }
  }

  onMount(() => {
    validateScheduleDate();
  });
</script>

<svelte:head>
	<title>New Schedule | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-7xl p-2 md:p-4">
	<!-- Page Header -->
	<div class="mb-4">
		<h1 class="text-2xl md:text-3xl font-bold text-center">Generate Schedule</h1>
		<p class="text-base-content/70 mt-2 text-center">
			Auto-generated schedule from active slots
		</p>
	</div>

	<form method="POST" use:enhance class="space-y-4">
		<!-- Schedule Metadata Card -->
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
							type="number"
							bind:value={$form.schedule.year}
							min={1900}
							max={2100}
							class="w-full"
              onchange={validateScheduleDate}
						/>
					</label>
					<label class="input w-full">
            <span class="label">Week</span>
						<input
							type="number"
							bind:value={$form.schedule.week}
							min={1}
							max={53}
							class="w-full"
              onchange={validateScheduleDate}
						/>
					</label>
					<label class="textarea w-full sm:col-span-2">
            <span class="label">Note</span>
						<textarea
							bind:value={() => $form.schedule.note || '', (v) => ($form.schedule.note = v === '' ? null : v)}
							class="w-full"
						></textarea>
					</label>
				</div>
			</div>
		</div>

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

				{#if $form.entries.length === 0}
					<div
						class="border border-dashed rounded-box p-4 border-base-content/20 bg-base-300/30 text-base-content/60 gap-2 flex items-center"
					>
						<Info class="h-5 w-5" />
						<span>No entries generated. Create active schedule slots first or add entries manually.</span>
					</div>
				{:else}
					<!-- Weekday Accordions -->
					<div class="space-y-2">
						{#each Array.from(entriesByWeekday.entries()).sort((a, b) => a[0] - b[0]) as [dayIndex, dayEntries]}
							<div class="card bg-base-100">
                <div class="card-body gap-0 p-0 group">
                  <div class={[
                    "transition-color duration-150 rounded-box rounded-b-none p-2 flex justify-between items-center",
                    "bg-primary/15 text-base-content",
                    "group-hover:bg-primary group-hover:text-primary-content"
                  ]}>
                    <span class="font-bold text-xl">{weekdayNames[dayIndex]}</span>
                    <div class="badge badge-ghost">{dayEntries.length} entrie(s)</div>
                  </div>
                  <ul class="list rounded-box rounded-t-none">
                    {#each dayEntries as { entry, index }}
                      <li class="list-row items-center justify-center hover:bg-base-300 rounded-none last:rounded-box last:rounded-t-none">
                        <!-- Entry Summary -->
                        <div class="flex items-center gap-2">
                          <Clock />
                          <span>{formatTime(entry.time)}</span>
                        </div>
                        <div class="badge {getTypeColor(entry.type)}">{entry.type}</div>
                        {#if entry.anime && entry.anime.length > 0}
                          <div class="flex flex-col gap-0 list-col-grow">
                            {#each formatAnimeInfo(entry.anime) as animeInfo}
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
                            <Trash2 class='size-4' />
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
		</div>

		<!-- Action Buttons -->
		<div class="flex gap-2">
			<button class="btn btn-success flex-1" type="submit">
				<Save class="h-4 w-4" />
				Save Schedule
			</button>
			<button
				class="btn {$form.schedule.preview ? 'btn-success' : 'btn-ghost'}"
				type="button"
				onclick={() => ($form.schedule.preview = !$form.schedule.preview)}
			>
				<Eye class="h-4 w-4" />
				Preview
			</button>
		</div>
	</form>
</div>

<!-- Add Entry Modal -->
<AddScheduleEntry
	id="add-schedule-entry-modal"
	availableSeasons={data.animeSeasons}
	availablePlatforms={data.platforms}
	onAdd={handleAddEntry}
  year={$form.schedule.year}
  week={$form.schedule.week}
/>

<!-- Edit Entry Modal -->
<EditScheduleEntry
	id="edit-schedule-entry-modal"
	availableSeasons={data.animeSeasons}
	availablePlatforms={data.platforms}
	entryData={editingEntry}
	onSave={handleEditSave}
/>
