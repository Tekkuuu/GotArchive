<script lang="ts">
	import { anilistServices as s } from '$lib/anilist';
	import { notification } from '$lib/components/ui/toaster';
	import { modalUtils } from '$lib/components/util';
	import { invalidateAll } from '$app/navigation';
	import _ from 'lodash';
	import { Book, Info, Link2, Plus, Search, Trash2, X } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { NewAnimeFormSchema } from '$lib/schemas';
	import { slide } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';

	interface Platform {
		platformId: string;
		name: string;
	}

	interface Genre {
		genreId: string;
		name: string;
	}

	interface Props {
		id: string;
		sForm: SuperValidated<Infer<typeof NewAnimeFormSchema>>;
		platforms: Platform[];
		genres: Genre[];
		action: string;
	}

	let { id, sForm, platforms, genres, action }: Props = $props();

	// svelte-ignore state_referenced_locally
		let { form, enhance, errors } = superForm(sForm, {
		dataType: 'json',
		validators: zod4Client(NewAnimeFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				notification.success('Anime created successfully');
				modalUtils.closeModal(id);
				invalidateAll();
			} else if (result.type === 'error' || result.type === 'failure') {
				notification.error('Failed to create anime');
			}
		}
	});

	let anilistId: number = $state(0);
	let isLoading: boolean = $state(false);

	async function fillForm(id: number) {
		isLoading = true;
		try {
			const response = await s.fetchAnime(id);

			$form.titleNative = response.title.native;
			$form.titleRomaji = response.title.romaji;
			$form.titleEnglish = response.title.english;

			const existingGenreNames = new Set(genres.map((genre) => genre.name));

			const newGenres = response.genres
				.filter((genre) => !existingGenreNames.has(genre))
				.map((genre) => ({
					genreId: crypto.randomUUID(),
					name: genre
				}));

			genres = [...genres, ...newGenres];

			$form.genres = genres.filter((x) => response.genres.find((g) => g === x.name));

			notification.success('Anime data fetched successfully', 1000);
		} catch (e: unknown) {
		  if (e instanceof Error) {
				notification.error(e.message, 5000);
			} else {
				notification.error('An unexpected error occurred while fetching anime details.', 5000);
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<dialog class="modal" {id}>
	<div class="modal-box w-11/12 max-w-4xl">
		<h3 class="font-bold text-xl mb-4">Add New Anime</h3>

		<!-- AniList Fetch Section -->
		<div class="card bg-base-300 mb-4">
			<div class="card-body p-4">
				<h4 class="card-title text-base mb-2">
					<Search class="h-4 w-4" />
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
								<Search class="h-4 w-4" />
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

		<!-- Main Form -->
		<form method="POST" {action} use:enhance class="space-y-4">
			<!-- Titles -->
			<fieldset class="fieldset bg-base-200 rounded-box p-4">
				<legend class="fieldset-legend">
					<Book class="h-4 w-4" />
					Anime Details
				</legend>

				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">Title (Native)</span>
							<input
								type="text"
								bind:value={$form.titleNative}
								placeholder="Original title in native language"
							/>
						</label>
						{#if $errors.titleNative}
							<p class="text-error text-xs mt-1">{$errors.titleNative}</p>
						{/if}
					</div>

					<label class="input w-full">
						<span class="label">Title (Romaji)</span>
						<input
							type="text"
							bind:value={
								() => $form.titleRomaji || '',
								(v) => ($form.titleRomaji = v === '' ? null : v)
							}
							placeholder="Romanized title"
						/>
					</label>

					<label class="input w-full">
						<span class="label">Title (English)</span>
						<input
							type="text"
							bind:value={
								() => $form.titleEnglish || '',
								(v) => ($form.titleEnglish = v === '' ? null : v)
							}
							placeholder="English title"
						/>
					</label>

					<label class="input w-full">
						<span class="label">Short Title</span>
						<input
							type="text"
							bind:value={
								() => $form.shortTitle || '',
								(v) => ($form.shortTitle = v === '' ? null : v)
							}
							placeholder="Abbreviated title"
						/>
					</label>

					<label class="input w-full">
						<span class="label">Logo URL</span>
						<input
							type="text"
							bind:value={
								() => $form.logoUrl || '',
								(v) => ($form.logoUrl = v === '' ? null : v)
							}
							placeholder="https://example.com/logo.png"
						/>
					</label>
				</div>

				{#if $form.logoUrl}
					<img
						src={$form.logoUrl}
						alt="Anime logo"
						class="max-h-16 w-auto object-contain mt-2"
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
							const add = genres.find((g) => g.genreId === e.currentTarget.value);
							if (!add) return;
							$form.genres = [...$form.genres, add];
							e.currentTarget.value = '';
						}}
					>
						<option value="" selected disabled>Add a genre...</option>
						{#each _.differenceBy(genres, $form.genres, (g) => _.lowerCase(_.deburr(g.name))) as genre}
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
											($form.genres = $form.genres.filter((g) => g.genreId !== genre.genreId))}
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
			</fieldset>

			<!-- Playlist Links -->
			<fieldset class="fieldset bg-base-200 rounded-box p-4">
				<legend class="fieldset-legend">
					<Link2 class="h-4 w-4" />
					Playlist Links
					<span class="badge badge-neutral badge-sm">{$form.links.length}</span>
				</legend>

				{#if $form.links.length === 0}
					<div
						class="border border-dashed rounded-box p-3 border-primary bg-primary/5 text-primary gap-3 font-bold flex items-center text-sm"
					>
						<Info class="h-4 w-4 shrink-0" />
						<span>No playlist links added yet.</span>
					</div>
				{/if}

				<div class="space-y-3">
					{#each { length: $form.links.length }, index}
						<div
							class="card bg-base-300"
							transition:slide={{ axis: 'y', duration: 200, easing: sineInOut }}
						>
							<div class="card-body p-3">
								<div class="flex items-center justify-between mb-2">
									<span class="badge badge-sm">Link {index + 1}</span>
									<button
										type="button"
										class="btn btn-ghost btn-circle btn-xs"
										onclick={() => ($form.links = $form.links.filter((_, i) => i !== index))}
									>
										<Trash2 class="h-3 w-3" />
									</button>
								</div>

								<div class="grid grid-cols-1 gap-2 md:grid-cols-3">
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
										<select bind:value={$form.links[index].platformId}>
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
												bind:value={
													() => $form.links[index].note || '',
													(v) => ($form.links[index].note = v === '' ? null : v)
												}
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
					class="btn btn-outline btn-sm mt-3 w-full"
					onclick={() => ($form.links = [...$form.links, { url: '', platformId: '', note: null }])}
				>
					<Plus class="h-4 w-4" />
					Add Link
				</button>
			</fieldset>

			<div class="modal-action">
				<button type="button" class="btn" onclick={() => modalUtils.closeModal(id)}>Cancel</button>
				<button type="submit" class="btn btn-success">
					<Plus class="h-4 w-4" />
					Create Anime
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
