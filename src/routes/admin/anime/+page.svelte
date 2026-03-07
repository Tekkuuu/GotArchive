<script lang="ts">
	import Fuse from 'fuse.js';
	import { Pencil, Trash2, Plus, ExternalLink, ImageOff } from 'lucide-svelte';
	import { modalUtils } from '$lib/components/util';
	import { notification } from '$lib/components/ui/toaster';
	import type { PageProps } from './$types';
	import { getAnimeImagesStore } from '$lib/stores';
	import { AddAnime, EditAnime, AddAnimeSeason } from '$lib/components/anime';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
  import { DeleteAnimeFormSchema } from '$lib/schemas/anime';
  import { updateAnimeImagesStore } from '$lib/stores';
	import { onMount } from 'svelte';
	import { logError } from '$lib/client/logger';

  type Anime = typeof data.anime[number];

	let { data }: PageProps = $props();
	let images = getAnimeImagesStore();

	let searchQuery: string = $state('');

  // svelte-ignore state_referenced_locally
  const { form: deleteForm, enhance: deleteEnhance, submit: deleteSubmit } = superForm(data.deleteAnimeForm, {
    dataType: 'json',
    validators: zod4Client(DeleteAnimeFormSchema),
    validationMethod: 'onsubmit',
    multipleSubmits: 'prevent',
    onResult: ({ result }) => {
      if (result.type === 'success') {
        notification.success('Anime deleted successfully');
      } else if (result.type === 'failure') {
        notification.error(result.data!.text || 'Failed to delete anime');
      } else if (result.type === 'error') {
        notification.error('An unexpected error occurred while deleting the anime');
      }
    },
  });

	const fuse = $derived(
		new Fuse(data.anime, {
			keys: ['series.titleNative', 'series.titleRomaji', 'series.titleEnglish', 'series.shortTitle'],
			threshold: 0.3,
			includeScore: true
		})
	);

	let filteredAnime = $derived.by(() => {
		if (!searchQuery) return data.anime;
		return fuse.search(searchQuery).map((r) => r.item);
	});

	function getAnimeImage(anilistId: number | null) {
		if (!anilistId) return null;
		return images.value.find((x) => x.id === anilistId);
	}

	function getTitle(anime: Anime['series']): string {
		return anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative ?? 'Untitled';
	}

	let editingAnime: (Anime['series'] & { genres: Anime['genres'], links: Anime['links'] }) | undefined = $state(undefined);

  function openEditModal(anime: typeof data.anime[number]) {
    editingAnime = {
      ...anime.series,
      genres: anime.genres,
      links: anime.links
    };
    modalUtils.openModal('edit-anime-modal');
  }

	async function handleDelete(animeId: string) {
		const confirmed = confirm(
			'Are you sure you want to delete this anime? This will also delete all its seasons.'
		);
		if (!confirmed) return;

		const confirmedAgain = confirm(
			'This will permanently delete the anime and all associated data. Are you absolutely sure?'
		);
		if (!confirmedAgain) return;

    $deleteForm.animeId = animeId;
    deleteSubmit();
	}

  onMount(() => {
    updateAnimeImagesStore(
      data.anime.map(
        (a) => a.seasons.sort(
          (a, b) => a.sequence - b.sequence
        )[0].anilistId
      ).filter((x) => x != null)).catch(
      (error) => {
        logError('Failed to update anime images store', { error: String(error) });
      }
    );
  });
</script>

<svelte:head>
	<title>Admin | Anime | G.O.T Archive</title>
</svelte:head>

<form class="hidden" use:deleteEnhance method="POST" action="?/deleteAnime">
  <input type="hidden" name="animeId" value={$deleteForm.animeId} />
</form>

<div class="container mx-auto max-w-6xl p-4">
	<!-- Page Header -->
	<div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold">Anime</h1>
			<p class="text-base-content/70 mt-1">Manage your anime library</p>
		</div>
		<div class="flex gap-2">
			<button class="btn btn-outline" onclick={() => modalUtils.openModal('add-season-modal')}>
				<Plus class="h-5 w-5" />
				Add Season
			</button>
			<button class="btn btn-primary" onclick={() => modalUtils.openModal('add-anime-modal')}>
				<Plus class="h-5 w-5" />
				Add Anime
			</button>
		</div>
	</div>

	<!-- Search -->
	<div class="mb-6">
		<input
			type="text"
			placeholder="Search anime..."
			bind:value={searchQuery}
			class="input input-bordered w-full"
		/>
	</div>

	<!-- Anime List -->
	<div class="list bg-base-200 rounded-box shadow">
		{#each filteredAnime as anime (anime.series.animeId)}
			{@const image = getAnimeImage(anime.seasons[0]?.anilistId)}
			<div class="list-row items-center py-3 gap-2">
				{#if image}
					<div class="hidden md:block">
						<div class="avatar">
							<div class="w-12 h-12 rounded">
								<img src={image.coverImage.medium} alt={getTitle(anime.series)} />
							</div>
						</div>
					</div>
				{:else}
					<ImageOff class="size-12 hidden md:block opacity-30" />
				{/if}

				<div class="flex-1 min-w-0">
					<div class="font-medium truncate">{getTitle(anime.series)}</div>
					<div class="flex items-center gap-2 mt-1">
						<span class="text-xs text-base-content/50">
							{anime.seasons.length} season{anime.seasons.length !== 1 ? 's' : ''}
						</span>
					</div>
				</div>

				<div class="flex gap-1 md:gap-2">
					<a
						href="/admin/anime/series/{anime.series.animeId}"
						class="btn btn-ghost btn-sm"
						title="View seasons"
					>
						<ExternalLink class="h-4 w-4" />
					</a>

					<button class="btn btn-ghost btn-sm" title="Edit" onclick={() => openEditModal(anime)}>
						<Pencil class="h-4 w-4" />
					</button>

          <button
            class="btn btn-ghost btn-sm text-error"
            title="Delete"
            onclick={() => handleDelete(anime.series.animeId)}
          >
            <Trash2 class="h-4 w-4" />
          </button>
				</div>
			</div>
		{:else}
			<div class="p-8 text-center text-base-content/60">No anime found</div>
		{/each}
	</div>
</div>

<AddAnime
	id="add-anime-modal"
	sForm={data.addAnimeForm}
	platforms={data.platforms}
	genres={data.genres}
	action="?/createAnime"
/>

<EditAnime
  id="edit-anime-modal"
  sForm={data.editAnimeForm}
  prefill={editingAnime}
  platforms={data.platforms}
  action="?/updateAnime"
/>

<AddAnimeSeason
	id="add-season-modal"
	sForm={data.addSeasonForm}
	anime={data.anime.map(a => a.series)}
	action="?/createSeason"
/>
