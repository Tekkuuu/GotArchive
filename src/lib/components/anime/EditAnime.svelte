<script lang="ts">
	import { notification } from '$lib/components/ui/toaster';
	import { errorMessage } from '$lib/errors';
	import { modalUtils } from '$lib/components/util';
	import { invalidateAll } from '$app/navigation';
	import { Book, Info, Link2, Plus, Trash2 } from 'lucide-svelte';
	import { updateAnime } from '$lib/remote/anime.remote';

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

	interface Prefill {
		animeId?: string;
		titleNative?: string | null;
		titleRomaji?: string | null;
		titleEnglish?: string | null;
		shortTitle?: string | null;
		logoUrl?: string | null;
		genres?: Genre[];
		links?: { url: string; platformId: string; note: string | null }[];
	}

	interface Props {
		id: string;
		platforms: Platform[];
		prefill?: Prefill;
	}

	let { id, platforms, prefill }: Props = $props();

	// Hidden id + arrays stay local.
	let animeId = $state('');
	let preservedGenres = $state<Genre[]>([]);
	let links = $state<LinkRow[]>([]);

	$effect(() => {
		if (!prefill) return;

		animeId = prefill.animeId ?? '';
		preservedGenres = prefill.genres ?? [];
		links = (prefill.links ?? []).map((link) => ({
			url: link.url,
			platformId: link.platformId,
			note: link.note ?? ''
		}));

		updateAnime.fields.set({
			titleNative: prefill.titleNative ?? undefined,
			titleRomaji: prefill.titleRomaji ?? undefined,
			titleEnglish: prefill.titleEnglish ?? undefined,
			shortTitle: prefill.shortTitle ?? undefined,
			logoUrl: prefill.logoUrl ?? undefined
		});
	});
</script>

<dialog class="modal" {id}>
	<div class="modal-box w-11/12 max-w-2xl">
		<h3 class="mb-4 text-xl font-bold">Edit Anime</h3>

		<form
			{...updateAnime.enhance(async (form) => {
				try {
					const success = await form.submit();
					if (success && form.result?.success) {
						notification.success('Anime updated successfully');
						modalUtils.closeModal(id);
						invalidateAll();
					} else if (!success) {
						notification.error('Failed to update anime. Check the form for errors.');
					}
				} catch (e) {
					notification.error(errorMessage(e, 'Failed to update anime'));
				}
			})}
			class="space-y-4"
		>
			<input type="hidden" name="animeId" value={animeId} />
			{#each preservedGenres as genre, index}
				<input type="hidden" name="genres[{index}].genreId" value={genre.genreId} />
				<input type="hidden" name="genres[{index}].name" value={genre.name} />
			{/each}

			<!-- Titles -->
			<fieldset class="fieldset bg-base-200 rounded-box p-4">
				<legend class="fieldset-legend">
					<Book class="size-4" />
					Anime details
				</legend>

				<label class="input w-full">
					<span class="label">Title (Native)</span>
					<input {...updateAnime.fields.titleNative.as('text')} placeholder="Original title" />
				</label>
				{#if updateAnime.fields.titleNative.issues()?.[0]}
					<p class="text-error mt-1 text-xs">
						{updateAnime.fields.titleNative.issues()?.[0]?.message}
					</p>
				{/if}

				<label class="input mt-2 w-full">
					<span class="label">Title (Romaji)</span>
					<input {...updateAnime.fields.titleRomaji.as('text')} placeholder="Romanized title" />
				</label>

				<label class="input mt-2 w-full">
					<span class="label">Title (English)</span>
					<input {...updateAnime.fields.titleEnglish.as('text')} placeholder="English title" />
				</label>

				<label class="input mt-2 w-full">
					<span class="label">Short Title</span>
					<input {...updateAnime.fields.shortTitle.as('text')} placeholder="Abbreviated title" />
				</label>

				<label class="input mt-2 w-full">
					<span class="label">Logo URL</span>
					<input
						{...updateAnime.fields.logoUrl.as('text')}
						placeholder="https://example.com/logo.png"
					/>
				</label>
			</fieldset>

			<fieldset class="fieldset bg-base-200 rounded-box p-4">
				<legend class="fieldset-legend">
					<Link2 class="size-4" />
					Playlists
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
					{#each links as link, i}
						<div class="card bg-base-300">
							<div class="card-body p-3">
								<div class="mb-2 flex items-center justify-between">
									<span class="badge badge-sm">Link {i + 1}</span>
									<button
										type="button"
										class="btn btn-ghost btn-circle btn-xs"
										onclick={() => (links = links.filter((_, index) => index !== i))}
									>
										<Trash2 class="size-4" />
									</button>
								</div>

								<label class="input w-full">
									<span class="label">Playlist URL</span>
									<input type="text" name="links[{i}].url" bind:value={link.url} />
								</label>
								<label class="select mt-2 w-full">
									<span class="label">Platform</span>
									<select name="links[{i}].platformId" bind:value={link.platformId}>
										<option value="" disabled selected>Select platform</option>
										{#each platforms as platform}
											<option value={platform.platformId}>{platform.name}</option>
										{/each}
									</select>
								</label>
								<label class="input mt-2 w-full">
									<span class="label">Note</span>
									<input type="text" name="links[{i}].note" bind:value={link.note} />
								</label>
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
				<button type="submit" class="btn btn-primary">Save Changes</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
