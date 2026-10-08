<script lang="ts">
	import { Save, Trash2 } from 'lucide-svelte';
	import { sineInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { modalUtils } from '$lib/components/util';
	import type { AnimeSeason, Platform } from '$lib/server/db';
	import { format } from 'date-fns';
	import { getWeekdays } from '../util';
	import { entryTypeEnum } from '$lib/schemas';
	import { z } from 'zod';
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
		onAdd: (entry: NewScheduleEntry) => void;
		year: number;
		week: number;
	}

	type EntryType = z.infer<typeof entryTypeEnum>;

	export interface NewScheduleEntry {
		type: EntryType;
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
		slotId: null;
	}

	let { id, availableSeasons, availablePlatforms, onAdd, year, week }: Props = $props();

	const ENTRY_TYPES: Array<{ value: EntryType; label: string }> = [
		{ value: 'anime', label: 'Anime' },
		{ value: 'hololive', label: 'Hololive' },
		{ value: 'game', label: 'Game' },
		{ value: 'event', label: 'Event' },
		{ value: 'sponsored', label: 'Sponsored' },
		{ value: 'misc', label: 'Misc' }
	];

	let entryType = $state<EntryType>('anime');
	let date = $state(format(new Date(), 'yyyy-MM-dd'));
	let time = $state('12:00');
	let title = $state('');
	let description = $state('');
	let logoUrl = $state('');
	let note = $state('');
	let cancelledText = $state('');

	let animeInputValue = $state('');
	let selectedAnimeId = $state<string | null>(null);

	let animeSeasons = $state<Array<{ animeSeasonId: string; episodes: string }>>([]);

	let selectedPlatforms = $state<string[]>([]);

	function resetForm() {
		entryType = 'misc';
		date = format(new Date(), 'yyyy-MM-dd');
		time = '12:00';
		title = '';
		description = '';
		logoUrl = '';
		note = '';
		cancelledText = '';
		animeInputValue = '';
		selectedAnimeId = null;
		animeSeasons = [];
		selectedPlatforms = [];
	}

	function handleAdd() {
		const newEntry: NewScheduleEntry = {
			type: entryType,
			date,
			time: time || null,
			note: note || null,
			logoUrl: logoUrl || null,
			title: title || null,
			description: description || null,
			cancelledText: cancelledText || null,
			isCancelled: false,
			anime: entryType === 'anime' && animeSeasons.length > 0 ? animeSeasons : null,
			platforms: selectedPlatforms.length > 0 ? selectedPlatforms : null,
			slotId: null
		};

		onAdd(newEntry);
		modalUtils.closeModal(id);
		resetForm();
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
			<!-- Basic -->
			<div class="card bg-base-300">
				<div class="card-body">
					<h3 class="font-bold">Basic Information</h3>
					<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
						<label class="select w-full">
							<span class="label">Type</span>
							<select bind:value={entryType} class="w-full">
								{#each ENTRY_TYPES as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</label>
						<label class="input w-full">
							<span class="label">Time</span>
							<input type="time" bind:value={time} class="w-full" />
						</label>
						<div class="col-span-2 flex grid-cols-7 flex-col gap-2 md:grid">
							{#each getWeekdays(year, week) as weekday}
								<button
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
				</div>
			</div>

			<!-- Content -->
			{#if entryType === 'anime'}
				<div
					class="card bg-base-300"
					transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}
				>
					<div class="card-body">
						<h3 class="font-bold">Anime Information</h3>
						<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
							<label class="input w-full">
								<datalist id="anime-list-add">
									{#each uniqueAnime as anime}
										<option value={anime.title}></option>
									{/each}
								</datalist>
								<span class="label">Anime</span>
								<input
									type="text"
									list="anime-list-add"
									bind:value={animeInputValue}
									oninput={(e) => {
										const selectedAnime = uniqueAnime.find(
											(anime) => anime.title === e.currentTarget.value
										);
										selectedAnimeId = selectedAnime?.animeId || null;
										animeSeasons = [];
									}}
									placeholder="Select or type anime title..."
									class="w-full"
								/>
							</label>
							<label class="select w-full">
								<span class="label">Season</span>
								<select
									class="w-full"
									disabled={selectedAnimeId === null}
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

						{#if selectedAnimeId && animeSeasons.length > 0}
							<div class="divider text-xs">Added Seasons</div>
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
											<input type="text" bind:value={animeSeason.episodes} class="input w-full" />
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
					</div>
				</div>
			{/if}

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
				<button type="button" class="btn btn-success flex-1" onclick={handleAdd}>
					<Save class="h-4 w-4" />
					Add Entry
				</button>
				<button
					type="button"
					class="btn btn-error"
					onclick={() => {
						modalUtils.closeModal(id);
						resetForm();
					}}
				>
					Cancel
				</button>
			</div>
		</div>
	</div>
</dialog>
