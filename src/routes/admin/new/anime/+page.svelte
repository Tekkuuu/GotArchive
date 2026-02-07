<script lang="ts">
	import { anilistServices as s } from '$lib/anilist';
	import { AppError } from '$lib/errors';
	import { toast } from '$lib/components/ui/toaster';
	import _ from 'lodash';
	import { Book, Info, Link2, Minus, Plus, Search, Trash2, X } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { formSchema } from './util';
	import { slide } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';

	let { data }: PageProps = $props();
	let { form, enhance, errors } = superForm(data.form, {
		dataType: 'json',
		validators: zod4Client(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime create successfully');
			} else if (result.type === 'error' || result.type === 'failure') {
				toast.error('Failed to create anime');
			}
		}
	});

	let anilistId: number = $state(0);
	let isLoading: boolean = $state(false);

	async function fillForm(anilistId: number) {
		isLoading = true;
		try {
			const response = await s.fetchAnime(anilistId);

			// Fill form
			$form.titleNative = response.title.native;
			$form.titleRomaji = response.title.romaji;
			$form.titleEnglish = response.title.english;

			const existingGenreNames = new Set(data.genres.map((genre) => genre.name));

			const newGenres = response.genres
				.filter((genre) => !existingGenreNames.has(genre)) // Filter out genres already present
				.map((genre) => ({
					genreId: crypto.randomUUID(),
					name: genre
				}));

			// Merge new genres into the existing data
			data.genres = [...data.genres, ...newGenres];

			$form.genres = data.genres.filter((x) => response.genres.find((g) => g === x.name));

			toast.success('Anime data fetched successfully', 1000);
		} catch (e: any) {
			if (e instanceof AppError) {
				toast.error(e.message, 5000);
			} else if (e instanceof Error) {
				// Fallback for unexpected errors
				toast.error(e.message, 5000);
			} else {
				toast.error('An unexpected error occurred while fetching anime details.', 5000);
			}
			return;
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Admin | New anime | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-5xl p-4">
	<!-- Page Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-center">Add New Anime</h1>
		<p class="text-base-content/70 mt-2 text-center">
			Fetch anime details from AniList or manually enter information
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
						<span class="label-text-alt">Enter the AniList anime ID to auto-fill details</span>
					</p>
        </fieldset>
				<div class="form-control sm:self-end">
				</div>
			</div>
		</div>
	</div>

	<!-- Main Form -->
	<form method="POST" action="?/create" id="form-new-anime" use:enhance class="space-y-6">
		<!-- Anime Details Section -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title mb-4">
          <Book class="h-5 w-5" />
          Anime Details
        </h2>

				<!-- Title Fields Grid -->
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
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

          <label class="input w-full">
            <span class="label">Logo URL</span>
            <input
              type="text"
              bind:value={() => $form.logoUrl || '', (v) => ($form.logoUrl = v === '' ? null : v)}
              placeholder="https://example.com/logo.png"
            />
          </label>
				</div>

        {#if $form.logoUrl !== null}
          <img src={$form.logoUrl} alt="Anime logo" class="max-h-24 w-auto object-contain" transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}/>
        {/if}

				<!-- Genres Section -->
				<div class="divider"></div>
				<fieldset class="fieldset">
					<legend class="fieldset-legend">Genres</legend>
					<select
						class="select select-bordered w-full"
						onchange={(e) => {
							const add = data.genres.find(
                g => g.genreId === e.currentTarget.value
							);
							if (!add) return;
							$form.genres = [...$form.genres, add];
							e.currentTarget.value = '';
						}}
					>
						<option value={''} selected disabled>Add a genre...</option>
						{#each _.differenceBy(data.genres, $form.genres, (g) => _.lowerCase(_.deburr(g.name))) as genre}
							<option value={genre.genreId}>{genre.name}</option>
						{/each}
					</select>

					{#if $form.genres.length > 0}
						<div class="mt-2 flex flex-wrap gap-2">
							{#each $form.genres as genre}
								<div class="badge badge-primary badge-lg gap-2">
									{genre.name}
									<button
										type="button"
										class="btn btn-ghost btn-circle btn-xs"
										onclick={() =>
											($form.genres = $form.genres.filter(
												(g) => g.genreId !== genre.genreId
											))}
									>
										<X class="h-3 w-3" />
									</button>
								</div>
							{/each}
						</div>
					{:else}
						<p class="label">
							<span class="label-text-alt text-base-content/60">No genres selected</span>
						</p>
					{/if}
				</fieldset>
			</div>
		</div>

		<!-- Playlist Links Section -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<div class="flex items-center justify-between mb-4">
					<h2 class="card-title">
            <Link2 class="h-5 w-5" />
            Playlist Links
          </h2>
					<div class="badge badge-neutral">{$form.links.length} link(s)</div>
				</div>

				{#if $form.links.length === 0}
					<div class="border border-dashed rounded-box p-4 border-primary bg-primary/5 text-primary gap-4 font-bold flex items-center">
            <Info />
						<span>No playlist links added yet. Click "Add Link" to get started.</span>
					</div>
				{/if}

				<div class="space-y-4">
					{#each $form.links as _, index}
						<div class="card bg-base-300" transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}>
							<div class="card-body p-4">
								<div class="flex items-start justify-between">
									<span class="badge badge-sm">Link {index + 1}</span>
									<button
										type="button"
										class="btn btn-ghost btn-circle btn-xs"
										onclick={() => ($form.links = $form.links.filter((_, i) => i !== index))}
									>
										<Trash2 class="h-4 w-4" />
									</button>
								</div>

								<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
									<div class="md:col-span-2">
										<label class="input w-full">
											<span class="label">URL</span>
                      <input
                        type="text"
                        bind:value={$form.links[index].url}
                        placeholder="https://example.com/playlist"
                      />
                      </label>
									</div>

										<label class="select w-full">
											<span class="label">Platform</span>
                      <select
                        bind:value={$form.links[index].platformId}
                      >
                        <option value={''} disabled selected>Select platform</option>
                        {#each data.platforms as platform}
                          <option value={platform.platformId}>{platform.name}</option>
                        {/each}
                      </select>
										</label>

									<div class="md:col-span-3">
										<label class="input w-full">
											<span class="label">Note (Optional)</span>
                      <input
                        type="text"
                        bind:value={
                          () => $form.links[index].note || '',
                          (v) => ($form.links[index].note = v === '' ? null : v)
                        }
                        placeholder="Additional information about this link"
                      />
										</label>
                  </div>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<!-- Add/Remove Link Buttons -->
				<div class="flex gap-2 mt-4">
					<button
						type="button"
						class="btn btn-primary flex-1"
						onclick={() => ($form.links = [...$form.links, { url: '', platformId: '', note: null }])}
					>
						<Plus class="h-4 w-4" />
						Add Link
					</button>
				</div>
			</div>
		</div>

		<!-- Submit Button -->
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body p-4">
				<button class="btn btn-success w-full">
					<Plus class="h-5 w-5" />
					<span class="font-bold">Create Anime</span>
				</button>
			</div>
		</div>
	</form>
</div>
