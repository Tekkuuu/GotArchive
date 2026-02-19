<script lang="ts">
	import { anilistServices as s } from '$lib/anilist';
	import { AppError } from '$lib/errors';
	import { notification } from '$lib/components/ui/toaster';
	import { modalUtils } from '$lib/components/util';
	import { invalidateAll } from '$app/navigation';
	import { Book, Search } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { NewSeasonFormSchema, seasonEnum, formatEnum } from '$lib/schemas';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import type { Anime } from '$lib/server/db';

	interface Props {
		id: string;
		sForm: SuperValidated<Infer<typeof NewSeasonFormSchema>>;
		anime: Anime[];
		action: string;
		/** When set, pre-selects and locks the parent anime. */
		lockedAnimeId?: string;
	}

	let { id, sForm, anime, action, lockedAnimeId }: Props = $props();

	// svelte-ignore state_referenced_locally
		let { form, enhance, errors } = superForm(sForm, {
		dataType: 'json',
		validators: zod4Client(NewSeasonFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				notification.success('Anime season created successfully');
				modalUtils.closeModal(id);
				invalidateAll();
			} else if (result.type === 'error' || result.type === 'failure') {
				notification.error('Failed to create anime season');
			}
		}
	});

	let anilistId: number = $state(0);
	let isLoading: boolean = $state(false);
	let animeInputValue: string = $state('');

	function getTitle(a: Anime): string {
		return a.titleEnglish ?? a.titleRomaji ?? a.titleNative ?? 'Untitled';
	}

	// Pre-select locked anime on mount / when lockedAnimeId changes
	$effect(() => {
		if (lockedAnimeId) {
			$form.animeId = lockedAnimeId;
			const locked = anime.find((a) => a.animeId === lockedAnimeId);
			if (locked) animeInputValue = getTitle(locked);
		}
	});

	async function fillForm(anilistIdVal: number) {
		isLoading = true;
		try {
			const response = await s.fetchAnimeSeason(anilistIdVal);

			$form.titleNative = response.title.native;
			$form.titleRomaji = response.title.romaji;
			$form.titleEnglish = response.title.english;
			$form.format = response.format;
			$form.season = response.season;
			$form.year = response.seasonYear;
			$form.episodes = response.episodes;
			$form.anilistId = response.id;
			$form.malId = response.idMal;

			notification.success('Anime season data fetched successfully', 1000);
		} catch (e: unknown) {
			if (e instanceof AppError) {
				notification.error(e.message, 5000);
			} else if (e instanceof Error) {
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
		<h3 class="font-bold text-xl mb-4">Add New Anime Season</h3>

		<!-- AniList Fetch -->
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
						<span class="label-text-alt">Enter the AniList media ID to auto-fill details</span>
					</p>
				</fieldset>
			</div>
		</div>

		<!-- Main Form -->
		<form method="POST" {action} use:enhance class="space-y-4">
			<fieldset class="fieldset bg-base-300 rounded-box p-4">
				<legend class="fieldset-legend">
					<Book class="h-4 w-4" />
					Season Details
				</legend>

				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<!-- Parent Anime -->
					<div class="md:col-span-2">
						<fieldset class="fieldset">
							<legend class="fieldset-legend">
								Parent Anime
							</legend>

						{#if lockedAnimeId}
							{@const locked = anime.find((a) => a.animeId === lockedAnimeId)}
                <label class="input w-full">
                  <span class="label">Parent anime</span>
                  <input type="text" value={locked ? getTitle(locked) : ""} disabled class="w-full" />
                </label>
						{:else}
							{@const datalistId = crypto.randomUUID()}
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
                      $form.animeId =
                        anime.find((a) => getTitle(a) === e.currentTarget.value)?.animeId ?? '';
                    }}
                  />
                </label>
						{/if}

							{#if $errors.animeId}
								<p class="text-error text-xs mt-1">{$errors.animeId}</p>
							{/if}
						</fieldset>
					</div>

					<label class="input w-full">
						<span class="label">Sequence</span>
						<input
							type="number"
							bind:value={$form.sequence}
							placeholder="Season number (e.g., 1)"
							min={1}
						/>
					</label>
					{#if $errors.sequence}
						<p class="text-error text-xs">{$errors.sequence}</p>
					{/if}

					<label class="select w-full">
						<span class="label">Format</span>
						<select bind:value={$form.format}>
							{#each formatEnum.options as format}
								<option value={format}>{format}</option>
							{/each}
						</select>
					</label>

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

					<label class="select w-full">
						<span class="label">Season</span>
						<select bind:value={$form.season}>
							<option value={null}>N/A</option>
							{#each seasonEnum.options as s}
                <option value={s}>{s}</option>
							{/each}
						</select>
					</label>

					<label class="input w-full">
						<span class="label">Year</span>
						<input
							type="number"
							bind:value={
								() => $form.year || '',
								(v) => ($form.year = v === '' ? null : Number(v))
							}
							min={1900}
							max={2100}
							placeholder="Release year"
						/>
					</label>

					<label class="input w-full">
						<span class="label">Episodes</span>
						<input
							type="number"
							bind:value={
								() => $form.episodes || '',
								(v) => ($form.episodes = v === '' ? null : Number(v))
							}
							min={1}
							placeholder="Total episode count"
						/>
					</label>

					<!-- Metadata -->
					<div class="md:col-span-2">
						<div class="divider my-1">Metadata</div>
					</div>

					<label class="input w-full">
						<span class="label">AniList ID</span>
						<input
							type="number"
							bind:value={
								() => $form.anilistId || '',
								(v) => ($form.anilistId = v === '' ? null : Number(v))
							}
							placeholder="AniList media ID"
							min={1}
						/>
					</label>

					<label class="input w-full">
						<span class="label">MAL ID</span>
						<input
							type="number"
							bind:value={
								() => $form.malId || '',
								(v) => ($form.malId = v === '' ? null : Number(v))
							}
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
								placeholder="Additional information"
							/>
						</label>
					</div>
				</div>
			</fieldset>

			<div class="modal-action">
				<button type="button" class="btn" onclick={() => modalUtils.closeModal(id)}>Cancel</button>
				<button type="submit" class="btn btn-success">
					<Book class="h-4 w-4" />
					Create Season
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
