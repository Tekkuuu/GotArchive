<script lang="ts">
	import { Info, Save, Lock, Trash2 } from 'lucide-svelte';
	import { sineInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { modalUtils } from '$lib/components/util';
	import type { AnimeSeason } from '$lib/server/db';

	interface Props {
		id: string;
		availableSeasons?: AnimeSeason[];
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
	}

	let { id, availableSeasons, entryData, onSave }: Props = $props();

	// Local editable state
	let time = $state('');
	let title = $state('');
	let description = $state('');
	let logoUrl = $state('');
	let note = $state('');
	let cancelledText = $state('');
	let isCancelled = $state(false);
	let animeSeasons = $state<Array<{ animeSeasonId: string; episodes: string }>>([]);

	// For adding new anime seasons
	let animeInputValue = $state('');
	let selectedAnimeId = $state<string | null>(null);

	// Update local state when entryData changes
	$effect(() => {
		if (entryData) {
			time = entryData.time || '';
			title = entryData.title || '';
			description = entryData.description || '';
			logoUrl = entryData.logoUrl || '';
			note = entryData.note || '';
			cancelledText = entryData.cancelledText || '';
			isCancelled = entryData.isCancelled;
			animeSeasons = entryData.anime ? [...entryData.anime] : [];
			animeInputValue = '';
			selectedAnimeId = null;
		}
	});

	function handleSave() {
		if (!entryData) return;

		onSave({
			...entryData,
			time: time || null,
			title: title || null,
			description: description || null,
			logoUrl: logoUrl || null,
			note: note || null,
			cancelledText: cancelledText || null,
			isCancelled,
			anime: animeSeasons.length > 0 ? animeSeasons : null
		});

		modalUtils.closeModal(id);
	}

	// Get unique anime list from seasons
	const uniqueAnime = $derived.by(() => {
		if (!availableSeasons) return [];
		const animeMap = new Map<string, { animeId: string; title: string }>();

		availableSeasons.forEach((season) => {
			if (!animeMap.has(season.animeId)) {
				animeMap.set(season.animeId, {
					animeId: season.animeId,
					title: season.titleEnglish || season.titleRomaji || season.titleNative || 'Unknown'
				});
			}
		});

		return Array.from(animeMap.values()).sort((a, b) => a.title.localeCompare(b.title));
	});

	// Filter seasons by selected anime
	const filteredSeasons = $derived(
		selectedAnimeId ? availableSeasons?.filter((s) => s.animeId === selectedAnimeId) || [] : []
	);

	function addAnimeSeason(seasonId: string) {
		if (!animeSeasons.some((s) => s.animeSeasonId === seasonId)) {
			animeSeasons = [...animeSeasons, { animeSeasonId: seasonId, episodes: '1' }];
		}
	}

	function removeAnimeSeason(seasonId: string) {
		animeSeasons = animeSeasons.filter((s) => s.animeSeasonId !== seasonId);
	}

	function getSeasonInfo(seasonId: string) {
		return availableSeasons?.find((s) => s.animeSeasonId === seasonId);
	}
</script>

<dialog class="modal" {id}>
	<div class="modal-box container bg-base-200">
		<div class="space-y-4">
			{#if entryData}
				<!-- Uneditable Data Display -->
				<div class="card">
					<div class="card-body bg-base-100 rounded-box">
						<div class="flex items-center gap-2">
							<Lock class="size-4" />
							<h3 class="text-sm font-semibold">Locked Properties</h3>
						</div>
						<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
							<div class="flex gap-2 p-2 bg-base-200 rounded-field">
								<span class="font-bold">Type</span>
								<span class="capitalize">{entryData.type}</span>
							</div>
							<div class="flex gap-2 p-2 bg-base-200 rounded-field">
								<span class="font-bold">Date</span>
								<span class="capitalize">{entryData.date}</span>
							</div>
						</div>
						<div class="text-xs text-base-content/50 flex items-center">
							<Info class="h-3 w-3" />
							<span>These properties cannot be changed after creation</span>
						</div>
					</div>
				</div>

				<!-- Basic Info Card -->
				<div class="card bg-base-300">
					<div class="card-body p-4">
						<h3 class="font-bold">Basic Information</h3>
						<label class="w-full input">
              <span class="label">Time</span>
							<input type="time" bind:value={time} class="w-full" />
						</label>
					</div>
				</div>

				<!-- Content Details Card -->
				<div class="card bg-base-300">
					<div class="card-body p-4">
						<h3 class="font-bold">Content Details</h3>
						<div class="grid grid-cols-1 gap-2">
							<label class="w-full input">
                <span class="label">Title</span>
								<input
									type="text"
									bind:value={title}
									class="w-full"
								/>
							</label>
							<label class="w-full input">
                <span class="label">Description</span>
								<input
									type="text"
									bind:value={description}
									class="w-full"
								/>
							</label>
							<label class="w-full input">
                <span class="label">Logo URL</span>
								<input
									type="url"
									bind:value={logoUrl}
									class="w-full"
								/>
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

				<!-- Anime Episodes Card (if anime type) -->
				{#if entryData.type === 'anime'}
					<div class="card bg-base-300">
						<div class="card-body">
							<h3 class="font-bold">Anime Episodes</h3>

							{#if animeSeasons.length > 0}
								<div class="space-y-2">
									{#each animeSeasons as animeSeason}
										{@const seasonInfo = getSeasonInfo(animeSeason.animeSeasonId)}
										<div class="flex items-center gap-2 p-2 bg-base-100 rounded-box">
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
												<Trash2 />
											</button>
										</div>
									{/each}
								</div>
							{/if}

							<div class="divider my-2 text-xs">Add More Seasons</div>
							<div class="grid grid-cols-1 md:grid-cols-2 gap-2">
								<label class="w-full input">
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
                <label class="w-full select">
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

				<!-- Additional Options Card -->
				<div class="card bg-base-300">
					<div class="card-body p-4">
						<h3 class="font-bold">Additional Options</h3>
						<div class="grid grid-cols-1 gap-2">
							<label class="w-full input">
                <span class="label">Note</span>
								<input
									type="text"
									bind:value={note}
									class="w-full"
								/>
							</label>
							<label class="w-full input">
                <span class="label">Cancelled Text</span>
								<input
									type="text"
									bind:value={cancelledText}
									class="w-full"
								/>
							</label>
						</div>
					</div>
				</div>

				<!-- Form Actions -->
				<div class="flex gap-2">
					<button type="button" class="btn btn-success flex-1" onclick={handleSave}>
						<Save class="h-4 w-4" />
						Save Changes
					</button>
					<button
						type="button"
						class="btn btn-error"
						onclick={() => modalUtils.closeModal(id)}
					>
						Cancel
					</button>
				</div>
			{/if}
		</div>
	</div>
</dialog>
