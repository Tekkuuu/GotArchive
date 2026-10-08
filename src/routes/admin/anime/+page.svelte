<script lang="ts">
	import Fuse from 'fuse.js';
	import { errorMessage } from '$lib/errors';
	import { getAnimeTitle, filterSearch, type SearchField } from '$lib/util';
	import { Pencil, Trash2, Plus, ExternalLink, ImageOff } from 'lucide-svelte';
	import { modalUtils } from '$lib/components/util';
	import { notification } from '$lib/components/ui/toaster';
	import type { PageProps } from './$types';
	import { getAnimeImagesStore } from '$lib/stores';
	import { AddAnime, EditAnime, AddAnimeSeason } from '$lib/components/anime';
	import SearchHelpPopover from '$lib/components/ui/SearchHelpPopover.svelte';
	import { deleteAnime } from '$lib/remote/anime.remote';
	import { updateAnimeImagesStore } from '$lib/stores';
	import { invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';

	type Anime = (typeof data.anime)[number];

	let { data }: PageProps = $props();
	let images = getAnimeImagesStore();

	let searchQuery: string = $state('');

	const fuse = $derived(
		new Fuse(data.anime, {
			keys: [
				'series.titleNative',
				'series.titleRomaji',
				'series.titleEnglish',
				'series.shortTitle'
			],
			threshold: 0.3
		})
	);

	const platformNames = $derived(
		new Map(data.platforms.map((platform) => [platform.platformId, platform.name]))
	);

	// Field vocabulary for `field:value` search terms. `-field:value` negates.
	const searchFields = $derived.by<Record<string, SearchField<Anime>>>(() => ({
		links: { type: 'number', get: (anime) => anime.links.length },
		platform: {
			type: 'text',
			get: (anime) => anime.links.map((link) => platformNames.get(link.platformId) ?? '')
		},
		linkurl: { type: 'text', get: (anime) => anime.links.map((link) => link.url) },
		note: { type: 'text', get: (anime) => anime.links.map((link) => link.note ?? '') },
		genre: { type: 'text', get: (anime) => anime.genres.map((genre) => genre.name) },
		seasons: { type: 'number', get: (anime) => anime.seasons.length },
		format: { type: 'text', get: (anime) => anime.seasons.map((season) => season.format) },
		year: {
			type: 'number',
			get: (anime) => anime.seasons.map((season) => season.year).filter((year) => year != null)
		},
		episodes: {
			type: 'number',
			get: (anime) => anime.seasons.map((season) => season.episodes).filter((e) => e != null)
		},
		anilist: {
			type: 'number',
			get: (anime) => anime.seasons.map((season) => season.anilistId).filter((id) => id != null)
		},
		mal: {
			type: 'number',
			get: (anime) => anime.seasons.map((season) => season.malId).filter((id) => id != null)
		}
	}));

	// Reading `fuse` in the body makes the cache reset when the data changes.
	const fuzzyMatch = $derived.by(() => {
		const activeFuse = fuse;
		const cache = new Map<string, Set<Anime>>();
		return (anime: Anime, value: string) => {
			let matches = cache.get(value);
			if (!matches) {
				matches = new Set(activeFuse.search(value).map((result) => result.item));
				cache.set(value, matches);
			}
			return matches.has(anime);
		};
	});

	let filteredAnime = $derived(filterSearch(data.anime, searchQuery, searchFields, fuzzyMatch));

	function getAnimeImage(anilistId: number | null) {
		if (!anilistId) return null;
		return images.value.find((x) => x.id === anilistId);
	}

	function getTitle(anime: Anime['series']): string {
		return getAnimeTitle(anime, 'Untitled');
	}

	let editingAnime:
		(Anime['series'] & { genres: Anime['genres']; links: Anime['links'] }) | undefined =
		$state(undefined);

	function openEditModal(anime: (typeof data.anime)[number]) {
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

		try {
			await deleteAnime({ animeId });
			notification.success('Anime deleted successfully');
			invalidateAll();
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to delete anime'));
		}
	}

	onMount(() => {
		updateAnimeImagesStore(
			data.anime
				.map((a) => a.seasons.slice().sort((a, b) => a.sequence - b.sequence)[0]?.anilistId)
				.filter((x) => x != null)
		).catch((error) => {
			console.error('Failed to update anime images store', { error: String(error) });
		});
	});
</script>

<svelte:head>
	<title>Admin | Anime | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-6xl p-4">
	<!-- Page Header -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
		<SearchHelpPopover
			bind:value={searchQuery}
			placeholder="Search anime... (e.g. links:0 -platform:youtube)"
			fields={Object.keys(searchFields)}
			operators={[
				{ token: '-', meaning: 'negate a term' },
				{ token: '"..."', meaning: 'quoted phrase' },
				{ token: '>', meaning: 'greater than' },
				{ token: '>=', meaning: 'greater or equal' },
				{ token: '<', meaning: 'less than' },
				{ token: '<=', meaning: 'less or equal' },
				{ token: '* ?', meaning: 'wildcards in text' }
			]}
		/>
		<p class="text-base-content/60 mt-2 text-xs">
			<span class="text-base-content font-medium">{filteredAnime.length}</span>
			of
			<span class="text-base-content font-medium">{data.anime.length}</span>
			series
		</p>
	</div>

	<!-- Anime List -->
	<div class="list bg-base-200 rounded-box shadow">
		{#each filteredAnime as anime (anime.series.animeId)}
			{@const image = getAnimeImage(anime.seasons[0]?.anilistId)}
			<div class="list-row items-center gap-2 py-3">
				{#if image}
					<div class="hidden md:block">
						<div class="avatar">
							<div class="h-12 w-12 rounded">
								<img src={image.coverImage.medium} alt={getTitle(anime.series)} />
							</div>
						</div>
					</div>
				{:else}
					<ImageOff class="hidden size-12 opacity-30 md:block" />
				{/if}

				<div class="min-w-0 flex-1">
					<div class="truncate font-medium">{getTitle(anime.series)}</div>
					<div class="mt-1 flex items-center gap-2">
						<span class="text-base-content/50 text-xs">
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
			<div class="text-base-content/60 p-8 text-center">No anime found</div>
		{/each}
	</div>
</div>

<AddAnime id="add-anime-modal" platforms={data.platforms} genres={data.genres} />

<EditAnime id="edit-anime-modal" prefill={editingAnime} platforms={data.platforms} />

<AddAnimeSeason id="add-season-modal" anime={data.anime.map((a) => a.series)} />
