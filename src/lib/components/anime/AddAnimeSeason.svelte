<script lang="ts">
	import { anilistServices as s } from '$lib/anilist';
	import { AppError, errorMessage } from '$lib/errors';
	import { getAnimeTitle } from '$lib/util';
	import { notification } from '$lib/components/ui/toaster';
	import { modalUtils } from '$lib/components/util';
	import { invalidateAll } from '$app/navigation';
	import { Book, Search } from 'lucide-svelte';
	import { createSeason } from '$lib/remote/anime.remote';
	import { seasonEnum, formatEnum } from '$lib/schemas';
	import type { Anime } from '$lib/server/db';

	interface Props {
		id: string;
		anime: Anime[];
		/** When set, pre-selects and locks the parent anime. */
		lockedAnimeId?: string;
	}

	let { id, anime, lockedAnimeId }: Props = $props();

	// Fixed id for input-datalist link.
	const datalistId = $derived(`anime-datalist-${id}`);

	// Parent lookup stays local.
	let animeId = $state('');
	let animeInputValue = $state('');
	let anilistFetchId = $state(0);
	let isLoading = $state(false);

	function getTitle(a: Anime): string {
		return getAnimeTitle(a, 'Untitled');
	}

	// Preselect locked anime.
	$effect(() => {
		if (lockedAnimeId) {
			animeId = lockedAnimeId;
			const locked = anime.find((a) => a.animeId === lockedAnimeId);
			if (locked) animeInputValue = getTitle(locked);
		}
	});

	async function fillForm(mediaId: number) {
		isLoading = true;
		try {
			const response = await s.fetchAnimeSeason(mediaId);

			createSeason.fields.set({
				titleNative: response.title.native,
				titleRomaji: response.title.romaji ?? undefined,
				titleEnglish: response.title.english ?? undefined,
				format: response.format,
				season: response.season ?? undefined,
				year: response.seasonYear ?? undefined,
				episodes: response.episodes ?? undefined,
				anilistId: response.id ?? undefined,
				malId: response.idMal ?? undefined
			});

			notification.success('Anime season data fetched successfully', 1000);
		} catch (e: unknown) {
			if (e instanceof AppError || e instanceof Error) {
				notification.error(e.message, 5000);
			} else {
				notification.error('An unexpected error occurred while fetching season details.', 5000);
			}
		} finally {
			isLoading = false;
		}
	}
</script>

<dialog class="modal" {id}>
	<div class="modal-box w-11/12 max-w-4xl">
		<h3 class="mb-4 text-xl font-bold">Add New Anime Season</h3>

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
							bind:value={anilistFetchId}
							placeholder="e.g., 21"
							class="input join-item flex-1"
							disabled={isLoading}
						/>
						<button
							type="button"
							class="btn btn-primary join-item"
							class:btn-disabled={isLoading}
							onclick={() => fillForm(anilistFetchId)}
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
						<span class="label-text-alt">Enter the AniList media ID to auto-fill details</span>
					</p>
				</fieldset>
			</div>
		</div>

		<!-- Form -->
		<form
			{...createSeason.enhance(async (form) => {
				try {
					const success = await form.submit();
					if (success && form.result?.success) {
						notification.success('Anime season created successfully');
						modalUtils.closeModal(id);
						invalidateAll();
					} else if (!success) {
						notification.error('Failed to create anime season. Check the form for errors.');
					}
				} catch (e) {
					notification.error(errorMessage(e, 'Failed to create anime season'));
				}
			})}
			class="space-y-4"
		>
			<input type="hidden" name="animeId" value={animeId} />

			<fieldset class="fieldset bg-base-300 rounded-box p-4">
				<legend class="fieldset-legend">
					<Book class="size-4" />
					Season Details
				</legend>

				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<!-- Parent -->
					<div class="md:col-span-2">
						<fieldset class="fieldset">
							<legend class="fieldset-legend">Parent Anime</legend>

							{#if lockedAnimeId}
								{@const locked = anime.find((a) => a.animeId === lockedAnimeId)}
								<label class="input w-full">
									<span class="label">Parent anime</span>
									<input
										type="text"
										value={locked ? getTitle(locked) : ''}
										disabled
										class="w-full"
									/>
								</label>
							{:else}
								<label class="input w-full">
									<span class="label">Parent anime</span>
									<datalist id={datalistId}>
										{#each anime as a}
											<option value={getTitle(a)}></option>
										{/each}
									</datalist>
									<input
										type="text"
										list={datalistId}
										bind:value={animeInputValue}
										oninput={(e) => {
											animeId =
												anime.find((a) => getTitle(a) === e.currentTarget.value)?.animeId ?? '';
										}}
									/>
								</label>
							{/if}

							{#if createSeason.fields.animeId.issues()?.[0]}
								<p class="text-error mt-1 text-xs">
									{createSeason.fields.animeId.issues()?.[0]?.message}
								</p>
							{/if}
						</fieldset>
					</div>

					<label class="input w-full">
						<span class="label">Sequence</span>
						<input
							{...createSeason.fields.sequence.as('number')}
							placeholder="Season number (e.g., 1)"
							min={1}
						/>
					</label>
					{#if createSeason.fields.sequence.issues()?.[0]}
						<p class="text-error text-xs">{createSeason.fields.sequence.issues()?.[0]?.message}</p>
					{/if}

					<label class="select w-full">
						<span class="label">Format</span>
						<select {...createSeason.fields.format.as('select')}>
							{#each formatEnum.options as format}
								<option value={format}>{format}</option>
							{/each}
						</select>
					</label>

					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">Title (Native)</span>
							<input
								{...createSeason.fields.titleNative.as('text')}
								placeholder="Original title in native language"
							/>
						</label>
						{#if createSeason.fields.titleNative.issues()?.[0]}
							<p class="text-error mt-1 text-xs">
								{createSeason.fields.titleNative.issues()?.[0]?.message}
							</p>
						{/if}
					</div>

					<label class="input w-full">
						<span class="label">Title (Romaji)</span>
						<input {...createSeason.fields.titleRomaji.as('text')} placeholder="Romanized title" />
					</label>

					<label class="input w-full">
						<span class="label">Title (English)</span>
						<input {...createSeason.fields.titleEnglish.as('text')} placeholder="English title" />
					</label>

					<label class="input w-full">
						<span class="label">Short Title</span>
						<input {...createSeason.fields.shortTitle.as('text')} placeholder="Abbreviated title" />
					</label>

					<label class="select w-full">
						<span class="label">Season</span>
						<select {...createSeason.fields.season.as('select')}>
							<option value="">N/A</option>
							{#each seasonEnum.options as season}
								<option value={season}>{season}</option>
							{/each}
						</select>
					</label>

					<label class="input w-full">
						<span class="label">Year</span>
						<input
							{...createSeason.fields.year.as('number')}
							min={1900}
							max={2100}
							placeholder="Release year"
						/>
					</label>

					<label class="input w-full">
						<span class="label">Episodes</span>
						<input
							{...createSeason.fields.episodes.as('number')}
							min={1}
							placeholder="Total episode count"
						/>
					</label>

					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">Skipped Episodes (Optional)</span>
							<input
								{...createSeason.fields.skippedEpisodes.as('text')}
								placeholder="e.g. 6-8,13 (fillers)"
							/>
						</label>
					</div>

					<!-- Meta -->
					<div class="md:col-span-2">
						<div class="divider my-1">Metadata</div>
					</div>

					<label class="input w-full">
						<span class="label">AniList ID</span>
						<input
							{...createSeason.fields.anilistId.as('number')}
							placeholder="AniList media ID"
							min={1}
						/>
					</label>

					<label class="input w-full">
						<span class="label">MAL ID</span>
						<input
							{...createSeason.fields.malId.as('number')}
							placeholder="MyAnimeList ID"
							min={1}
						/>
					</label>

					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">Note (Optional)</span>
							<input
								{...createSeason.fields.note.as('text')}
								placeholder="Additional information"
							/>
						</label>
					</div>
				</div>
			</fieldset>

			<div class="modal-action">
				<button type="button" class="btn" onclick={() => modalUtils.closeModal(id)}>Cancel</button>
				<button type="submit" class="btn btn-success">
					<Book class="size-4" />
					Create Season
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
