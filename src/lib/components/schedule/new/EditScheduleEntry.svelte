<script lang="ts">
	import { Info, Save, Lock, Trash2 } from 'lucide-svelte';
	import { sineInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { format, getISOWeek, getISOWeekYear, parseISO } from 'date-fns';
	import { getWeekdays } from '../util';
	import { modalUtils } from '$lib/components/util';
	import type { AnimeSeason, Platform } from '$lib/server/db';
	import {
		uniqueAnime as buildUniqueAnime,
		filteredSeasons as filterSeasons,
		addSeasonSelection,
		removeSeasonSelection,
		getSeasonInfo as findSeasonInfo
	} from '$lib/util/scheduleEntry';

	interface Props {
		id: string;
		availableSeasons?: AnimeSeason[];
		availablePlatforms?: Platform[];
		entryData: EntryData | null;
		onSave: (data: EntryData) => void;
	}

	export interface EntryData {
		type: string;
		date: string;
		time: string | null;
		note: string | null;
		logoUrl: string | null;
		title: string | null;
		description: string | null;
		cancelledText: string | null;
		isCancelled: boolean;
		anime: Array<{ animeSeasonId: string; episodes: string }> | null;
		platforms: string[] | null;
	}

	let { id, availableSeasons, availablePlatforms, entryData, onSave }: Props = $props();

	// Remount-initialised state; no $effect sync.
	// svelte-ignore state_referenced_locally
	let date = $state(entryData?.date ?? '');
	// svelte-ignore state_referenced_locally
	let time = $state(entryData?.time ?? '');
	// svelte-ignore state_referenced_locally
	let title = $state(entryData?.title ?? '');
	// svelte-ignore state_referenced_locally
	let description = $state(entryData?.description ?? '');
	// svelte-ignore state_referenced_locally
	let logoUrl = $state(entryData?.logoUrl ?? '');
	// svelte-ignore state_referenced_locally
	let note = $state(entryData?.note ?? '');
	// svelte-ignore state_referenced_locally
	let cancelledText = $state(entryData?.cancelledText ?? '');
	// svelte-ignore state_referenced_locally
	let isCancelled = $state(entryData?.isCancelled ?? false);
	// svelte-ignore state_referenced_locally
	let animeSeasons = $state<Array<{ animeSeasonId: string; episodes: string }>>(
		entryData?.anime ? [...entryData.anime] : []
	);

	// svelte-ignore state_referenced_locally
	let selectedPlatforms = $state<string[]>(entryData?.platforms ? [...entryData.platforms] : []);

	let animeInputValue = $state('');
	let selectedAnimeId = $state<string | null>(null);

	// Fixed-week days; date stays inside week.
	const weekdays = $derived.by(() => {
		if (!entryData?.date) return [];
		const anchor = parseISO(entryData.date);
		return getWeekdays(getISOWeekYear(anchor), getISOWeek(anchor));
	});

	function handleSave() {
		if (!entryData) return;

		onSave({
			...entryData,
			date,
			time: time || null,
			title: title || null,
			description: description || null,
			logoUrl: logoUrl || null,
			note: note || null,
			cancelledText: cancelledText || null,
			isCancelled,
			anime: animeSeasons.length > 0 ? animeSeasons : null,
			platforms: selectedPlatforms.length > 0 ? selectedPlatforms : null
		});

		modalUtils.closeModal(id);
	}

	const uniqueAnime = $derived.by(() => buildUniqueAnime(availableSeasons));

	const filteredSeasons = $derived(filterSeasons(availableSeasons, selectedAnimeId));

	function addAnimeSeason(seasonId: string) {
		animeSeasons = addSeasonSelection(animeSeasons, seasonId);
	}

	function removeAnimeSeason(seasonId: string) {
		animeSeasons = removeSeasonSelection(animeSeasons, seasonId);
	}

	function getSeasonInfo(seasonId: string) {
		return findSeasonInfo(availableSeasons, seasonId);
	}
</script>

<dialog class="modal" {id}>
	<div class="modal-box bg-base-200 container">
		<div class="space-y-4">
			{#if entryData}
				<!-- Locked -->
				<div class="card">
					<div class="card-body bg-base-100 rounded-box">
						<div class="flex items-center gap-2">
							<Lock class="size-4" />
							<h3 class="text-sm font-semibold">Locked Properties</h3>
						</div>
						<div class="bg-base-200 rounded-field flex gap-2 p-2">
							<span class="font-bold">Type</span>
							<span class="capitalize">{entryData.type}</span>
						</div>
						<div class="text-base-content/50 flex items-center text-xs">
							<Info class="size-4" />
							<span>This property cannot be changed after creation</span>
						</div>
					</div>
				</div>

				<!-- Basic -->
				<div class="card bg-base-300">
					<div class="card-body p-4">
						<h3 class="font-bold">Basic Information</h3>
						<div class="flex flex-col gap-2">
							<span class="label">Day</span>
							<div class="flex grid-cols-7 flex-col gap-2 md:grid">
								{#each weekdays as weekday}
									<button
										type="button"
										class={[
											'btn-neutral btn',
											format(weekday, 'yyyy-MM-dd') === date ? 'btn-success' : ''
										]}
										onclick={() => (date = format(weekday, 'yyyy-MM-dd'))}
									>
										{format(weekday, 'EEEE')}
									</button>
								{/each}
							</div>
						</div>
						<label class="input mt-2 w-full">
							<span class="label">Time</span>
							<input type="time" bind:value={time} class="w-full" />
						</label>
					</div>
				</div>

				<!-- Content -->
				<div class="card bg-base-300">
					<div class="card-body p-4">
						<h3 class="font-bold">Content Details</h3>
						<div class="grid grid-cols-1 gap-2">
							<label class="input w-full">
								<span class="label">Title</span>
								<input type="text" bind:value={title} class="w-full" />
							</label>
							<label class="input w-full">
								<span class="label">Description</span>
								<input type="text" bind:value={description} class="w-full" />
							</label>
							<label class="input w-full">
								<span class="label">Logo URL</span>
								<input type="url" bind:value={logoUrl} class="w-full" />
							</label>
							{#if logoUrl}
								<img
									src={logoUrl}
									alt="Content logo"
									class="max-h-24 w-auto object-contain"
									transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}
								/>
							{/if}
						</div>
					</div>
				</div>

				<!-- Episodes -->
				{#if entryData.type === 'anime'}
					<div class="card bg-base-300">
						<div class="card-body">
							<h3 class="font-bold">Anime Episodes</h3>

							{#if animeSeasons.length > 0}
								<div class="space-y-2">
									{#each animeSeasons as animeSeason}
										{@const seasonInfo = getSeasonInfo(animeSeason.animeSeasonId)}
										<div class="bg-base-100 rounded-box flex items-center gap-2 p-2">
											<div class="flex-1">
												<div class="text-sm font-medium">
													{seasonInfo?.shortTitle ||
														seasonInfo?.titleEnglish ||
														seasonInfo?.titleRomaji}
												</div>
												{#if seasonInfo?.episodes}
													<div class="text-xs opacity-70">{seasonInfo.episodes} episodes total</div>
												{/if}
											</div>
											<label class="tooltip" data-tip="Format examples: '1', '1-4', '1,3', '1,4-6'">
												<input
													type="text"
													bind:value={animeSeason.episodes}
													placeholder="1-4,6"
													class="input w-full"
												/>
											</label>
											<button
												type="button"
												class="btn btn-square btn-error"
												onclick={() => removeAnimeSeason(animeSeason.animeSeasonId)}
											>
												<Trash2 class="size-4" />
											</button>
										</div>
									{/each}
								</div>
							{/if}

							<div class="divider my-2 text-xs">Add More Seasons</div>
							<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
								<label class="input w-full">
									<datalist id="anime-list-edit">
										{#each uniqueAnime as anime}
											<option value={anime.title}></option>
										{/each}
									</datalist>
									<span class="label">Select Anime</span>
									<input
										type="text"
										list="anime-list-edit"
										bind:value={animeInputValue}
										oninput={(e) => {
											const selectedAnime = uniqueAnime.find(
												(anime) => anime.title === e.currentTarget.value
											);
											selectedAnimeId = selectedAnime?.animeId || null;
										}}
										placeholder="Type anime title..."
										class="w-full"
									/>
								</label>
								<label class="select w-full">
									<span class="label">Season</span>
									<select
										class="w-full"
										disabled={selectedAnimeId == null}
										onchange={(e) => {
											const seasonId = e.currentTarget.value;
											if (seasonId) {
												addAnimeSeason(seasonId);
												e.currentTarget.value = '';
											}
										}}
									>
										<option value="">Select a season to add...</option>
										{#each filteredSeasons as season}
											<option value={season.animeSeasonId}>
												{season.shortTitle || season.titleEnglish || season.titleRomaji}
											</option>
										{/each}
									</select>
								</label>
							</div>
						</div>
					</div>
				{/if}

				<!-- Platforms -->
				<div class="card bg-base-300">
					<div class="card-body p-4">
						<h3 class="font-bold">Platforms</h3>
						<div class="flex flex-wrap gap-2">
							{#each availablePlatforms ?? [] as platform}
								{@const isSelected = selectedPlatforms.includes(platform.platformId)}
								<button
									type="button"
									class="badge badge-lg transition-colors {isSelected
										? 'badge-primary'
										: 'badge-ghost'}"
									onclick={() => {
										if (isSelected) {
											selectedPlatforms = selectedPlatforms.filter(
												(id) => id !== platform.platformId
											);
										} else {
											selectedPlatforms = [...selectedPlatforms, platform.platformId];
										}
									}}
								>
									{platform.name}
								</button>
							{/each}
						</div>
						{#if (availablePlatforms ?? []).length === 0}
							<div class="text-base-content/60 text-sm">No platforms available</div>
						{/if}
					</div>
				</div>

				<!-- Options -->
				<div class="card bg-base-300">
					<div class="card-body p-4">
						<h3 class="font-bold">Additional Options</h3>
						<div class="grid grid-cols-1 gap-2">
							<label class="input w-full">
								<span class="label">Note</span>
								<input type="text" bind:value={note} class="w-full" />
							</label>
							<label class="input w-full">
								<span class="label">Cancelled Text</span>
								<input type="text" bind:value={cancelledText} class="w-full" />
							</label>
						</div>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-2">
					<button type="button" class="btn btn-success flex-1" onclick={handleSave}>
						<Save class="size-4" />
						Save Changes
					</button>
					<button type="button" class="btn btn-error" onclick={() => modalUtils.closeModal(id)}>
						Cancel
					</button>
				</div>
			{/if}
		</div>
	</div>
</dialog>
