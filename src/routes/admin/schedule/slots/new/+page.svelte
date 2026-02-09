<script lang="ts">
	import { toast } from '$lib/components/ui/toaster';
	import { Plus, Calendar, Clock, Type, X, Info } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { formSchema, DAY_NAMES, SCHEDULE_ENTRY_TYPES } from '../util';
	import { slide } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import _ from 'lodash';

	let { data }: PageProps = $props();
	let { form, enhance, errors } = superForm(data.form, {
		dataType: 'json',
		validators: zod4Client(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Schedule slot created successfully');
			} else if (result.type === 'error' || result.type === 'failure') {
				toast.error('Failed to create schedule slot');
			}
		}
	});

	// Derived state for conditional sections
	let isAnimeType = $derived($form.type === 'anime');
	
	// Track selected anime for season filtering
	let selectedAnimeId = $state<string | null>(null);
	
	// Filter seasons based on selected anime
	let filteredSeasons = $derived(
		selectedAnimeId ? data.animeSeasons.filter((s) => s.animeId === selectedAnimeId) : []
	);

	let selectedAnimeSeason = $derived(
		data.animeSeasons.find((s) => s.animeSeasonId === $form.animeSeasonId)
	);

	// Group anime seasons by anime
	let animeWithSeasons = $derived(_.groupBy(data.animeSeasons, 'animeId'));
</script>

<svelte:head>
	<title>New Schedule Slot | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-5xl p-4">
	<!-- Page Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-center">Create Schedule Slot</h1>
		<p class="text-base-content/70 mt-2 text-center">
			Schedule slots act as templates for automatic schedule entry creation
		</p>
	</div>

	<!-- Main Form -->
	<form method="POST" action="?/create" use:enhance class="space-y-6">
		<!-- Basic Information Section -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title mb-4">
					<Calendar class="h-5 w-5" />
					Basic Information
				</h2>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Day of Week -->
					<label class="select w-full">
						<span class="label">
							Day of Week <span class="text-error">*</span>
						</span>
						<select bind:value={$form.dayOfWeek} required>
							<option value={null} disabled selected>Select a day</option>
							{#each DAY_NAMES as day, index}
								<option value={index}>{day}</option>
							{/each}
						</select>
					</label>

					<!-- Time -->
					<label class="input w-full">
						<span class="label">Time</span>
						<input
							type="time"
							bind:value={() => $form.time || '', (v) => ($form.time = v === '' ? null : v)}
						/>
					</label>

					<!-- Type -->
					<label class="select w-full">
						<span class="label">Type</span>
						<select
							bind:value={() => $form.type || '', (v) => ($form.type = v === '' ? null : v)}
						>
							<option value={''}>None selected</option>
							{#each SCHEDULE_ENTRY_TYPES as type}
								<option value={type.value}>{type.label}</option>
							{/each}
						</select>
					</label>

					<!-- Is Active -->
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" class="toggle toggle-success" bind:checked={$form.isActive} />
						<span class="label-text">Active</span>
					</label>
				</div>
			</div>
		</div>

		<!-- Anime-Specific Fields -->
		{#if isAnimeType}
			<div class="card bg-base-200 shadow-xl" transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}>
				<div class="card-body">
					<h2 class="card-title mb-4">
						<Type class="h-5 w-5" />
						Anime Details
					</h2>

					<div class="grid grid-cols-1 gap-4">
						<!-- Anime Selection -->
						<label class="input w-full">
							<span class="label">Search Anime</span>
							<input
								type="text"
								list="anime-list"
								placeholder="Start typing anime name..."
								oninput={(e) => {
									const input = e.currentTarget.value;
									const anime = data.anime.find(
										(a) =>
											a.titleNative === input ||
											a.titleRomaji === input ||
											a.titleEnglish === input
									);
									if (anime) {
										selectedAnimeId = anime.animeId;
										// Reset season selection when anime changes
										$form.animeSeasonId = null;
									} else {
										selectedAnimeId = null;
									}
								}}
							/>
						</label>
						<datalist id="anime-list">
							{#each data.anime as anime}
								<option value={anime.titleNative}>
									{#if anime.titleEnglish && anime.titleEnglish !== anime.titleNative}
										{anime.titleEnglish}
									{/if}
								</option>
							{/each}
						</datalist>

						<!-- Season Selection (only show when anime is selected) -->
						{#if selectedAnimeId && filteredSeasons.length > 0}
							<label class="select w-full" transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}>
								<span class="label">Select Season</span>
								<select
									bind:value={() => $form.animeSeasonId || '', (v) => ($form.animeSeasonId = v === '' ? null : v)}
								>
									<option value={''}>Select a season...</option>
									{#each filteredSeasons as season}
										<option value={season.animeSeasonId}>
											S{season.sequence} - {season.titleNative}
											{#if season.year}({season.year}){/if}
										</option>
									{/each}
								</select>
							</label>
						{/if}

						{#if selectedAnimeSeason}
							<div class="alert" transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}>
								<Info class="h-5 w-5" />
								<div>
									<p class="font-semibold">{selectedAnimeSeason.titleNative}</p>
									<p class="text-sm opacity-70">
										{#if selectedAnimeSeason.titleEnglish}
											{selectedAnimeSeason.titleEnglish} •
										{/if}
										Season {selectedAnimeSeason.sequence} •
										{selectedAnimeSeason.format}
										{#if selectedAnimeSeason.episodes}
											• {selectedAnimeSeason.episodes} episodes
										{/if}
									</p>
								</div>
							</div>
						{/if}

						<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
							<!-- Starting Episode -->
							<label class="input w-full">
								<span class="label">Starting Episode</span>
								<input
									type="number"
									min="1"
									bind:value={() => $form.startingEpisode || '', (v) => ($form.startingEpisode = v === '' ? null : Number(v))}
									placeholder="e.g., 1"
								/>
							</label>

							<!-- Episode Count per Slot -->
							<label class="input w-full">
								<span class="label">Episodes per Slot</span>
								<input
									type="number"
									min="1"
									bind:value={() => $form.episodeCount || '', (v) => ($form.episodeCount = v === '' ? null : Number(v))}
									placeholder="e.g., 1"
								/>
							</label>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Non-Anime or Override Fields -->
		{#if !isAnimeType || $form.type === null}
			<div class="card bg-base-200 shadow-xl" transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}>
				<div class="card-body">
					<h2 class="card-title mb-4">
						<Type class="h-5 w-5" />
						Content Details
					</h2>

					<div class="grid grid-cols-1 gap-4">
						<!-- Title -->
						<label class="input w-full">
							<span class="label">Title</span>
							<input
								type="text"
								bind:value={() => $form.title || '', (v) => ($form.title = v === '' ? null : v)}
								placeholder="Stream title"
							/>
						</label>

						<!-- Description -->
						<label class="textarea w-full">
							<span class="label">Description</span>
							<textarea
								bind:value={() => $form.description || '', (v) => ($form.description = v === '' ? null : v)}
								placeholder="Additional details about this slot"
								rows="3"
							></textarea>
						</label>

						<!-- Logo URL -->
						<label class="input w-full">
							<span class="label">Logo URL</span>
							<input
								type="url"
								bind:value={() => $form.logoUrl || '', (v) => ($form.logoUrl = v === '' ? null : v)}
								placeholder="https://example.com/logo.png"
							/>
						</label>

						{#if $form.logoUrl}
							<img
								src={$form.logoUrl}
								alt="Logo preview"
								class="max-h-24 w-auto object-contain"
								transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}
							/>
						{/if}
					</div>
				</div>
			</div>
		{/if}

		<!-- Platforms Section -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title mb-4">Platforms</h2>

				<select
					class="select select-bordered w-full"
					onchange={(e) => {
						const platformId = e.currentTarget.value;
						const platform = data.platforms.find((p) => p.platformId === platformId);
						if (!platform) return;
						$form.platforms = [...$form.platforms, { platformId }];
						e.currentTarget.value = '';
					}}
				>
					<option value={''} selected disabled>Add a platform...</option>
					{#each _.differenceBy(data.platforms, $form.platforms, (p) => p.platformId) as platform}
						<option value={platform.platformId}>{platform.name}</option>
					{/each}
				</select>

				{#if $form.platforms.length > 0}
					<div class="mt-2 flex flex-wrap gap-2">
						{#each $form.platforms as platform, index}
							{@const platformData = data.platforms.find((p) => p.platformId === platform.platformId)}
							<div class="badge badge-primary badge-lg gap-2">
								{platformData?.name ?? 'Unknown'}
								<button
									type="button"
									class="btn btn-ghost btn-circle btn-xs"
									onclick={() => ($form.platforms = $form.platforms.filter((_, i) => i !== index))}
								>
									<X class="h-3 w-3" />
								</button>
							</div>
						{/each}
					</div>
				{:else}
					<p class="label">
						<span class="label-text-alt text-base-content/60">No platforms selected</span>
					</p>
				{/if}
			</div>
		</div>

		<!-- Additional Options -->
		<details class="card bg-base-200 shadow-xl">
			<summary class="card-body cursor-pointer">
				<h2 class="card-title">Additional Options</h2>
			</summary>
			<div class="card-body pt-0">
				<div class="grid grid-cols-1 gap-4">
					<!-- Cancelled Text -->
					<label class="input w-full">
						<span class="label">Cancelled Text</span>
						<input
							type="text"
							bind:value={() => $form.cancelledText || '', (v) => ($form.cancelledText = v === '' ? null : v)}
							placeholder="Default message when this slot is cancelled"
						/>
					</label>

					<!-- Note -->
					<label class="input w-full">
						<span class="label">Note</span>
						<input
							type="text"
							bind:value={() => $form.note || '', (v) => ($form.note = v === '' ? null : v)}
							placeholder="Internal notes about this slot"
						/>
					</label>
				</div>
			</div>
		</details>

		<!-- Bulk Duplicate Section -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title mb-4">Duplicate to Other Days (Optional)</h2>
				<p class="text-sm text-base-content/70 mb-4">
					Select additional days to create copies of this slot
				</p>

				<div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
					{#each DAY_NAMES as day, index}
						{@const isCurrentDay = index === $form.dayOfWeek}
						{@const isSelected = $form.duplicateToDays.includes(index)}
						<label class="flex items-center gap-2 cursor-pointer" class:opacity-50={isCurrentDay}>
							<input
								type="checkbox"
								class="checkbox checkbox-primary"
								disabled={isCurrentDay}
								checked={isSelected}
								onchange={(e) => {
									if (e.currentTarget.checked) {
										$form.duplicateToDays = [...$form.duplicateToDays, index];
									} else {
										$form.duplicateToDays = $form.duplicateToDays.filter((d) => d !== index);
									}
								}}
							/>
							<span class="label-text">{day}</span>
						</label>
					{/each}
				</div>

				{#if $form.duplicateToDays.length > 0}
					<div class="mt-2 alert alert-info" transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}>
						<Info class="h-5 w-5" />
						<span>
							This will create {$form.duplicateToDays.length + 1} slot(s) total
							({DAY_NAMES[$form.dayOfWeek]}, {$form.duplicateToDays.map((d) => DAY_NAMES[d]).join(', ')})
						</span>
					</div>
				{/if}
			</div>
		</div>

		<!-- Submit Button -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body p-4">
				<button class="btn btn-success w-full">
					<Plus class="h-5 w-5" />
					<span class="font-bold">Create Schedule Slot</span>
				</button>
			</div>
		</div>
	</form>
</div>
