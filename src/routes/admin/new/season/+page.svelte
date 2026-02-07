<script lang="ts">
	import { anilistServices as s } from '$lib/anilist';
	import { AppError } from '$lib/errors';
	import { toast } from '$lib/components/ui/toaster';
	import _ from 'lodash';
	import { Book, Info, Search, Plus, ChevronDown, X } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { formSchema } from './util';
	import { slide } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import Fuse from 'fuse.js';

	let { data }: PageProps = $props();
	let { form, enhance, errors } = superForm(data.form, {
		dataType: 'json',
		validators: zod4Client(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime season created successfully');
			} else if (result.type === 'error' || result.type === 'failure') {
				toast.error('Failed to create anime season');
			}
		}
	});

	let anilistId: number = $state(0);
	let isLoading: boolean = $state(false);

	// Anime search setup
	let animeSearchQuery: string = $state('');
	let isAnimeDropdownOpen: boolean = $state(false);
	let animeDropdownRef: HTMLDivElement | null = $state(null);

	const fuse = new Fuse(data.anime, {
		keys: ['titleNative', 'titleRomaji', 'titleEnglish', 'shortTitle'],
		threshold: 0.3,
		includeScore: true
	});

	let filteredAnime = $derived.by(() => {
		if (!animeSearchQuery) {
			return data.anime;
		}
		return fuse.search(animeSearchQuery).map(result => result.item);
	});

	let selectedAnime = $derived.by(() => {
		return data.anime.find((a: typeof data.anime[0]) => a.animeId === $form.animeId);
	});

	function selectAnime(anime: typeof data.anime[0]) {
		$form.animeId = anime.animeId;
		animeSearchQuery = '';
		isAnimeDropdownOpen = false;
	}

	function clearAnimeSelection() {
		$form.animeId = '';
		animeSearchQuery = '';
	}

	// Click outside to close dropdown
	function handleClickOutside(event: MouseEvent) {
		if (animeDropdownRef && !animeDropdownRef.contains(event.target as Node)) {
			isAnimeDropdownOpen = false;
		}
	}

	$effect(() => {
		if (isAnimeDropdownOpen) {
			document.addEventListener('click', handleClickOutside);
			return () => {
				document.removeEventListener('click', handleClickOutside);
			};
		}
	});

	async function fillForm(anilistId: number) {
		isLoading = true;
		try {
			const response = await s.fetchAnimeSeason(anilistId);

			// Fill form
			$form.titleNative = response.title.native;
			$form.titleRomaji = response.title.romaji;
			$form.titleEnglish = response.title.english;
			$form.format = response.format;
			$form.season = response.season;
			$form.year = response.seasonYear;
			$form.episodes = response.episodes;
			$form.anilistId = response.id;
			$form.malId = response.idMal;

			toast.success('Anime season data fetched successfully', 1000);
		} catch (e: any) {
			if (e instanceof AppError) {
				toast.error(e.message, 5000);
			} else if (e instanceof Error) {
				// Fallback for unexpected errors
				toast.error(e.message, 5000);
			} else {
				toast.error('An unexpected error occurred while fetching anime season details.', 5000);
			}
			return;
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Admin | New anime season | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-5xl p-4">
	<!-- Page Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-center">Add New Anime Season</h1>
		<p class="text-base-content/70 mt-2 text-center">
			Fetch anime season details from AniList or manually enter information
		</p>
	</div>

	<!-- AniList Fetch Section -->
	<div class="card bg-base-200 shadow-xl mb-6">
		<div class="card-body">
			<h2 class="card-title mb-4">
				<Search class="h-5 w-5" />
				Fetch from AniList
			</h2>
			<div class="flex flex-col gap-3 sm:flex-row">
				<fieldset class="fieldset flex flex-col flex-1">
					<legend class="fieldset-legend">AniList ID</legend>
          <div class="join">
					<input
						type="number"
						required
						min={1}
						bind:value={anilistId}
						placeholder="e.g., 21"
						class="input join-item flex-1"
						disabled={isLoading}
					/>
					<button
						class="btn btn-primary join-item"
						class:btn-disabled={isLoading}
						onclick={() => {
							fillForm(anilistId);
						}}
					>
						{#if isLoading}
							<span class="loading loading-spinner loading-sm"></span>
							Fetching...
						{:else}
							<Search class="h-4 w-4" />
							Fetch Data
						{/if}
					</button>
          </div>
					<p class="label">
						<span class="label-text-alt">Enter the AniList media ID to auto-fill details</span>
					</p>
        </fieldset>
			</div>
		</div>
	</div>

	<!-- Main Form -->
	<form method="POST" action="?/create" id="form-new-season" use:enhance class="space-y-6">
		<!-- Season Details Section -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title mb-4">
          <Book class="h-5 w-5" />
          Season Details
        </h2>

				<!-- Anime Selection -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div class="md:col-span-2">
						<fieldset class="fieldset">
							<legend class="fieldset-legend">
								Parent Anime <span class="text-error">*</span>
							</legend>
							
							{#if selectedAnime}
								<!-- Selected Anime Display -->
								<div class="flex items-center justify-between p-3 bg-base-300 rounded-box">
									<div class="flex-1">
										<p class="font-medium">
											{selectedAnime.titleEnglish ?? selectedAnime.titleRomaji ?? selectedAnime.titleNative}
										</p>
										{#if selectedAnime.titleEnglish && (selectedAnime.titleRomaji || selectedAnime.titleNative)}
											<p class="text-sm text-base-content/60">
												{selectedAnime.titleRomaji ?? selectedAnime.titleNative}
											</p>
										{/if}
									</div>
									<button
										type="button"
										class="btn btn-ghost btn-circle btn-sm"
										onclick={clearAnimeSelection}
									>
										<X class="h-4 w-4" />
									</button>
								</div>
							{:else}
								<!-- Searchable Dropdown -->
								<div class="relative" bind:this={animeDropdownRef}>
									<div
										class={[
                      "input flex items-center justify-between cursor-pointer w-full",
                      isAnimeDropdownOpen && "border-base-content outline-2"
                    ]}
                    style={isAnimeDropdownOpen ? "outline-offset: 2px" : ""}
										onclick={() => {
											isAnimeDropdownOpen = !isAnimeDropdownOpen;
										}}
									>
										<span class="text-base-content/60">Search and select anime...</span>
										<ChevronDown class="h-4 w-4" />
									</div>

									{#if isAnimeDropdownOpen}
										<div
											class="absolute z-10 w-full mt-2 bg-base-300 rounded-box shadow-xl max-h-96 overflow-hidden flex flex-col"
											transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}
										>
											<!-- Search Input -->
											<div class="p-2 border-b border-base-content/10">
												<input
													type="text"
													class="input input-sm w-full"
													placeholder="Type to search..."
													bind:value={animeSearchQuery}
													autofocus
												/>
											</div>

											<!-- Results List -->
											<div class="overflow-y-auto flex-1">
												{#if filteredAnime.length === 0}
													<div class="p-4 text-center text-base-content/60">
														No anime found
													</div>
												{:else}
													{#each filteredAnime.slice(0, 50) as anime}
														<button
															type="button"
															class="w-full p-3 text-left hover:bg-base-100 transition-colors border-b border-base-content/5 last:border-b-0"
															onclick={() => selectAnime(anime)}
														>
															<p class="font-medium">
																{anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative}
															</p>
															{#if anime.titleEnglish && (anime.titleRomaji || anime.titleNative)}
																<p class="text-sm text-base-content/60">
																	{anime.titleRomaji ?? anime.titleNative}
																</p>
															{/if}
														</button>
													{/each}
												{/if}
											</div>

											{#if filteredAnime.length > 50}
												<div class="p-2 text-center text-sm text-base-content/60 border-t border-base-content/10">
													Showing 50 of {filteredAnime.length} results. Refine your search for more.
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/if}

							<p class="label">
								<span class="label-text-alt">Search by any title variant</span>
							</p>
						</fieldset>
					</div>

					<label class="input w-full">
						<span class="label">
							Sequence <span class="text-error">*</span>
						</span>
						<input
							type="number"
							bind:value={$form.sequence}
							placeholder="Season number (e.g., 1, 2, 3)"
							min={1}
						/>
					</label>

					<label class="select w-full">
						<span class="label">
							Format <span class="text-error">*</span>
						</span>
						<select bind:value={$form.format}>
							{#each data.formats as format}
								<option value={format}>{format}</option>
							{/each}
						</select>
					</label>

					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">
								Title (Native) <span class="text-error">*</span>
							</span>
              <input
                type="text"
                bind:value={$form.titleNative}
                placeholder="Original title in native language"
              />
						</label>
					</div>

          <label class="input w-full">
            <span class="label">Title (Romaji)</span>
            <input
              type="text"
              bind:value={
                () => $form.titleRomaji || '', (v) => ($form.titleRomaji = v === '' ? null : v)
              }
              placeholder="Romanized title"
            />
          </label>

          <label class="input w-full">
            <span class="label">Title (English)</span>
            <input
              type="text"
              bind:value={
                () => $form.titleEnglish || '', (v) => ($form.titleEnglish = v === '' ? null : v)
              }
              placeholder="English title"
            />
          </label>

          <label class="input w-full">
            <span class="label">Short Title</span>
            <input
              type="text"
              bind:value={() => $form.shortTitle || '', (v) => ($form.shortTitle = v === '' ? null : v)}
              placeholder="Abbreviated title"
            />
          </label>

          <label class="select w-full">
            <span class="label">Season</span>
            <select bind:value={$form.season}>
              <option value={null}>N/A</option>
              {#each data.seasons as season}
                <option value={season}>{season}</option>
              {/each}
            </select>
          </label>

          <label class="input w-full">
            <span class="label">Year</span>
            <input
              type="number"
              bind:value={() => $form.year || '', (v) => ($form.year = v === '' ? null : v)}
              min={1900}
              max={2100}
              placeholder="Release year"
            />
          </label>

          <label class="input w-full">
            <span class="label">Episodes</span>
            <input
              type="number"
              bind:value={() => $form.episodes || '', (v) => ($form.episodes = v === '' ? null : v)}
              min={1}
              placeholder="Total episode count"
            />
          </label>
				</div>

				<!-- Metadata Section -->
				<div class="divider"></div>
				<h3 class="text-lg font-semibold mb-2">Metadata</h3>
				
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<label class="input w-full">
						<span class="label">AniList ID</span>
						<input
							type="number"
							bind:value={() => $form.anilistId || '', (v) => ($form.anilistId = v === '' ? null : v)}
							placeholder="AniList media ID"
							min={1}
						/>
					</label>

					<label class="input w-full">
						<span class="label">MAL ID</span>
						<input
							type="number"
							bind:value={() => $form.malId || '', (v) => ($form.malId = v === '' ? null : v)}
							placeholder="MyAnimeList ID"
							min={1}
						/>
					</label>

					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">Note (Optional)</span>
							<input
								type="text"
								bind:value={
									() => $form.note || '',
									(v) => ($form.note = v === '' ? null : v)
								}
								placeholder="Additional information or notes"
							/>
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- Submit Button -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body p-4">
				<button class="btn btn-success w-full">
					<Plus class="h-5 w-5" />
					<span class="font-bold">Create Anime Season</span>
				</button>
			</div>
		</div>
	</form>
</div>
