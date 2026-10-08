<script lang="ts">
	import { anilistServices as s } from '$lib/anilist';
	import { errorMessage } from '$lib/errors';
	import { notification } from '$lib/components/ui/toaster';
	import { modalUtils } from '$lib/components/util';
	import { invalidateAll } from '$app/navigation';
	import { deburr, differenceBy, lowerCase } from 'lodash-es';
	import { Book, Info, Link2, Plus, Search, Trash2, X } from 'lucide-svelte';
	import { createAnime } from '$lib/remote/anime.remote';
	import { slide } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';

	interface Platform {
		platformId: string;
		name: string;
	}

	interface Genre {
		genreId: string;
		name: string;
	}

	interface LinkRow {
		url: string;
		platformId: string;
		note: string;
	}

	interface Props {
		id: string;
		platforms: Platform[];
		genres: Genre[];
	}

	let { id, platforms, genres }: Props = $props();

	let addedGenres = $state<Genre[]>([]);
	const allGenres = $derived([...genres, ...addedGenres]);

	let selectedGenres = $state<Genre[]>([]);
	let links = $state<LinkRow[]>([]);

	let anilistId = $state(0);
	let isLoading = $state(false);

	async function fillForm(mediaId: number) {
		isLoading = true;
		try {
			const response = await s.fetchAnime(mediaId);

			createAnime.fields.set({
				titleNative: response.title.native,
				titleRomaji: response.title.romaji ?? undefined,
				titleEnglish: response.title.english ?? undefined
			});

			const existingGenres = new Set(allGenres.map((genre) => genre.name));

			const newGenres = response.genres
				.filter((genre) => !existingGenres.has(genre))
				.map((genre) => ({
					genreId: crypto.randomUUID(),
					name: genre
				}));

			addedGenres = [...addedGenres, ...newGenres];
			selectedGenres = allGenres.filter((genre) => response.genres.includes(genre.name));

			notification.success('Anime data fetched successfully', 1000);
		} catch (e: unknown) {
			notification.error(
				e instanceof Error
					? e.message
					: 'An unexpected error occurred while fetching anime details.',
				5000
			);
		} finally {
			isLoading = false;
		}
	}
</script>

<dialog class="modal" {id}>
	<div class="modal-box w-11/12 max-w-4xl">
		<h3 class="mb-4 text-xl font-bold">Add New Anime</h3>

		<!-- Fetch -->
		<div class="card bg-base-300 mb-4">
			<div class="card-body p-4">
				<h4 class="card-title mb-2 text-base">
					<Search class="size-4" />
					Fetch from AniList
				</h4>
				<fieldset class="fieldset">
					<legend class="fieldset-legend">AniList ID</legend>
					<div class="join w-full">
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
							type="button"
							class="btn btn-primary join-item"
							class:btn-disabled={isLoading}
							onclick={() => fillForm(anilistId)}
						>
							{#if isLoading}
								<span class="loading loading-spinner loading-sm"></span>
								Fetching...
							{:else}
								<Search class="size-4" />
								Fetch Data
							{/if}
						</button>
					</div>
					<p class="label">
						<span class="label-text-alt">Enter the AniList anime ID to auto-fill details</span>
					</p>
				</fieldset>
			</div>
		</div>

		<!-- Form -->
		<form
			{...createAnime.enhance(async (form) => {
				try {
					const success = await form.submit();
					if (success && form.result?.success) {
						notification.success('Anime created successfully');
						modalUtils.closeModal(id);
						invalidateAll();
					} else if (!success) {
						notification.error('Failed to create anime. Check the form for errors.');
					}
				} catch (e) {
					notification.error(errorMessage(e, 'Failed to create anime'));
				}
			})}
			class="space-y-4"
		>
			<!-- Titles -->
			<fieldset class="fieldset bg-base-200 rounded-box p-4">
				<legend class="fieldset-legend">
					<Book class="size-4" />
					Anime Details
				</legend>

				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">Title (Native)</span>
							<input
								{...createAnime.fields.titleNative.as('text')}
								placeholder="Original title in native language"
							/>
						</label>
						{#if createAnime.fields.titleNative.issues()?.[0]}
							<p class="text-error mt-1 text-xs">
								{createAnime.fields.titleNative.issues()?.[0]?.message}
							</p>
						{/if}
					</div>

					<label class="input w-full">
						<span class="label">Title (Romaji)</span>
						<input {...createAnime.fields.titleRomaji.as('text')} placeholder="Romanized title" />
					</label>

					<label class="input w-full">
						<span class="label">Title (English)</span>
						<input {...createAnime.fields.titleEnglish.as('text')} placeholder="English title" />
					</label>

					<label class="input w-full">
						<span class="label">Short Title</span>
						<input {...createAnime.fields.shortTitle.as('text')} placeholder="Abbreviated title" />
					</label>

					<label class="input w-full">
						<span class="label">Logo URL</span>
						<input
							{...createAnime.fields.logoUrl.as('text')}
							placeholder="https://example.com/logo.png"
						/>
					</label>
				</div>

				{#if createAnime.fields.logoUrl.value()}
					<img
						src={createAnime.fields.logoUrl.value() ?? ''}
						alt="Anime logo"
						class="mt-2 max-h-16 w-auto object-contain"
						transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}
					/>
				{/if}

				<!-- Genres -->
				<div class="divider my-2"></div>
				<fieldset class="fieldset">
					<legend class="fieldset-legend">Genres</legend>
					<select
						class="select select-bordered w-full"
						onchange={(e) => {
							const add = allGenres.find((g) => g.genreId === e.currentTarget.value);
							if (!add) return;
							if (!selectedGenres.some((g) => g.genreId === add.genreId)) {
								selectedGenres = [...selectedGenres, add];
							}
							e.currentTarget.value = '';
						}}
					>
						<option value="" selected disabled>Add a genre...</option>
						{#each differenceBy( allGenres, selectedGenres, (g) => lowerCase(deburr(g.name)) ) as genre}
							<option value={genre.genreId}>{genre.name}</option>
						{/each}
					</select>

					{#each selectedGenres as genre, index}
						<input type="hidden" name="genres[{index}].genreId" value={genre.genreId} />
						<input type="hidden" name="genres[{index}].name" value={genre.name} />
					{/each}

					{#if selectedGenres.length > 0}
						<div class="mt-2 flex flex-wrap gap-2">
							{#each selectedGenres as genre}
								<div class="badge badge-primary badge-lg gap-2">
									{genre.name}
									<button
										type="button"
										class="btn btn-ghost btn-circle btn-xs"
										onclick={() =>
											(selectedGenres = selectedGenres.filter((g) => g.genreId !== genre.genreId))}
									>
										<X class="size-4" />
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
			</fieldset>

			<!-- Links -->
			<fieldset class="fieldset bg-base-200 rounded-box p-4">
				<legend class="fieldset-legend">
					<Link2 class="size-4" />
					Playlist Links
					<span class="badge badge-neutral badge-sm">{links.length}</span>
				</legend>

				{#if links.length === 0}
					<div
						class="rounded-box border-primary bg-primary/5 text-primary flex items-center gap-3 border border-dashed p-3 text-sm font-bold"
					>
						<Info class="size-4 shrink-0" />
						<span>No playlist links added yet.</span>
					</div>
				{/if}

				<div class="space-y-3">
					{#each links as link, index}
						<div
							class="card bg-base-300"
							transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}
						>
							<div class="card-body p-3">
								<div class="mb-2 flex items-center justify-between">
									<span class="badge badge-sm">Link {index + 1}</span>
									<button
										type="button"
										class="btn btn-ghost btn-circle btn-xs"
										onclick={() => (links = links.filter((_, i) => i !== index))}
									>
										<Trash2 class="size-4" />
									</button>
								</div>

								<div class="grid grid-cols-1 gap-2 md:grid-cols-3">
									<div class="md:col-span-2">
										<label class="input w-full">
											<span class="label">URL</span>
											<input
												type="text"
												name="links[{index}].url"
												bind:value={link.url}
												placeholder="https://example.com/playlist"
											/>
										</label>
									</div>

									<label class="select w-full">
										<span class="label">Platform</span>
										<select name="links[{index}].platformId" bind:value={link.platformId}>
											<option value="" disabled selected>Select platform</option>
											{#each platforms as platform}
												<option value={platform.platformId}>{platform.name}</option>
											{/each}
										</select>
									</label>

									<div class="md:col-span-3">
										<label class="input w-full">
											<span class="label">Note (Optional)</span>
											<input
												type="text"
												name="links[{index}].note"
												bind:value={link.note}
												placeholder="Additional info"
											/>
										</label>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>

				<button
					type="button"
					class="btn btn-outline btn-sm mt-4 w-full"
					onclick={() => (links = [...links, { url: '', platformId: '', note: '' }])}
				>
					<Plus class="size-4" />
					Add Link
				</button>
			</fieldset>

			<div class="modal-action">
				<button type="button" class="btn" onclick={() => modalUtils.closeModal(id)}>Cancel</button>
				<button type="submit" class="btn btn-success">
					<Plus class="size-4" />
					Create Anime
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
