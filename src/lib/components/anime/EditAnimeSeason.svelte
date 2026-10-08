<script lang="ts">
	import { notification } from '$lib/components/ui/toaster';
	import { errorMessage } from '$lib/errors';
	import { modalUtils } from '$lib/components/util';
	import { invalidateAll } from '$app/navigation';
	import { Book, Save } from 'lucide-svelte';
	import { updateSeason } from '$lib/remote/anime.remote';
	import { seasonEnum, formatEnum, type Format, type Season } from '$lib/schemas';
	import { formatEpisodeList } from '$lib/util/schedule/episodeProgressParser';

	interface Prefill {
		animeSeasonId: string;
		sequence?: number | null;
		format?: Format | null;
		titleNative?: string | null;
		titleRomaji?: string | null;
		titleEnglish?: string | null;
		shortTitle?: string | null;
		season?: Season | null;
		year?: number | null;
		episodes?: number | null;
		episodeProgress?: number | null;
		anilistId?: number | null;
		malId?: number | null;
		note?: string | null;
		skippedEpisodes?: number[] | null;
	}

	interface Props {
		id: string;
		prefill?: Prefill;
	}

	let { id, prefill }: Props = $props();

	// Hidden id stays local.
	let animeSeasonId = $state('');

	$effect(() => {
		if (!prefill) return;

		animeSeasonId = prefill.animeSeasonId;

		updateSeason.fields.set({
			sequence: prefill.sequence ?? undefined,
			format: prefill.format ?? undefined,
			titleNative: prefill.titleNative ?? undefined,
			titleRomaji: prefill.titleRomaji ?? undefined,
			titleEnglish: prefill.titleEnglish ?? undefined,
			shortTitle: prefill.shortTitle ?? undefined,
			season: prefill.season ?? undefined,
			year: prefill.year ?? undefined,
			episodes: prefill.episodes ?? undefined,
			episodeProgress: prefill.episodeProgress ?? undefined,
			anilistId: prefill.anilistId ?? undefined,
			malId: prefill.malId ?? undefined,
			note: prefill.note ?? undefined,
			skippedEpisodes: formatEpisodeList(prefill.skippedEpisodes)
		});
	});
</script>

<dialog class="modal" {id}>
	<div class="modal-box w-11/12 max-w-3xl">
		<h3 class="mb-4 text-xl font-bold">Edit Season</h3>

		<form
			{...updateSeason.enhance(async (form) => {
				try {
					const success = await form.submit();
					if (success && form.result?.success) {
						notification.success('Season updated successfully');
						modalUtils.closeModal(id);
						invalidateAll();
					} else if (!success) {
						notification.error('Failed to update season. Check the form for errors.');
					}
				} catch (e) {
					notification.error(errorMessage(e, 'Failed to update season'));
				}
			})}
			class="space-y-4"
		>
			<input type="hidden" name="animeSeasonId" value={animeSeasonId} />

			<fieldset class="fieldset bg-base-200 rounded-box p-4">
				<legend class="fieldset-legend">
					<Book class="size-4" />
					Season Details
				</legend>

				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<label class="input w-full">
						<span class="label">Sequence</span>
						<input
							{...updateSeason.fields.sequence.as('number')}
							placeholder="Season number (e.g., 1)"
							min={1}
						/>
					</label>
					{#if updateSeason.fields.sequence.issues()?.[0]}
						<p class="text-error text-xs">{updateSeason.fields.sequence.issues()?.[0]?.message}</p>
					{/if}

					<label class="select w-full">
						<span class="label">Format <span class="text-error">*</span></span>
						<select {...updateSeason.fields.format.as('select')}>
							{#each formatEnum.options as format}
								<option value={format}>{format}</option>
							{/each}
						</select>
					</label>

					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">Title (Native) <span class="text-error">*</span></span>
							<input
								{...updateSeason.fields.titleNative.as('text')}
								placeholder="Original title in native language"
							/>
						</label>
						{#if updateSeason.fields.titleNative.issues()?.[0]}
							<p class="text-error mt-1 text-xs">
								{updateSeason.fields.titleNative.issues()?.[0]?.message}
							</p>
						{/if}
					</div>

					<label class="input w-full">
						<span class="label">Title (Romaji)</span>
						<input {...updateSeason.fields.titleRomaji.as('text')} placeholder="Romanized title" />
					</label>

					<label class="input w-full">
						<span class="label">Title (English)</span>
						<input {...updateSeason.fields.titleEnglish.as('text')} placeholder="English title" />
					</label>

					<label class="input w-full">
						<span class="label">Short Title</span>
						<input {...updateSeason.fields.shortTitle.as('text')} placeholder="Abbreviated title" />
					</label>

					<label class="select w-full">
						<span class="label">Season</span>
						<select {...updateSeason.fields.season.as('select')}>
							<option value="">N/A</option>
							{#each seasonEnum.options as season}
								<option value={season}>{season}</option>
							{/each}
						</select>
					</label>

					<label class="input w-full">
						<span class="label">Year</span>
						<input
							{...updateSeason.fields.year.as('number')}
							min={1900}
							max={2100}
							placeholder="Release year"
						/>
					</label>

					<label class="input w-full">
						<span class="label">Episodes</span>
						<input
							{...updateSeason.fields.episodes.as('number')}
							min={1}
							placeholder="Total episode count"
						/>
					</label>

					<label class="input col-span-2 w-full">
						<span class="label">Episode Progress</span>
						<input
							{...updateSeason.fields.episodeProgress.as('number')}
							min={0}
							placeholder="Episode progress"
						/>
					</label>

					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">Skipped Episodes</span>
							<input
								{...updateSeason.fields.skippedEpisodes.as('text')}
								placeholder="e.g. 6-8,13 (fillers)"
							/>
						</label>
						<p class="text-base-content/60 mt-1 text-xs">
							Numbers/ranges to exclude from the watched count (stored as a set).
						</p>
					</div>

					<!-- Metadata -->
					<div class="md:col-span-2">
						<div class="divider my-1">Metadata</div>
					</div>

					<label class="input w-full">
						<span class="label">AniList ID</span>
						<input
							{...updateSeason.fields.anilistId.as('number')}
							placeholder="AniList media ID"
							min={1}
						/>
					</label>

					<label class="input w-full">
						<span class="label">MAL ID</span>
						<input
							{...updateSeason.fields.malId.as('number')}
							placeholder="MyAnimeList ID"
							min={1}
						/>
					</label>

					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">Note (Optional)</span>
							<input
								{...updateSeason.fields.note.as('text')}
								placeholder="Additional information"
							/>
						</label>
					</div>
				</div>
			</fieldset>

			<div class="modal-action">
				<button type="button" class="btn" onclick={() => modalUtils.closeModal(id)}>Cancel</button>
				<button type="submit" class="btn btn-primary">
					<Save class="size-4" />
					Save Changes
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
