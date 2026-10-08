<script lang="ts">
	import type { PageProps } from './$types';
	import type { AnimeCard } from '../types';
	import { MediaQuery } from 'svelte/reactivity';
	import Fuse from 'fuse.js';
	import { Search, List, ListVideo, X, ChevronDown } from 'lucide-svelte';
	import { getAnimeImagesStore } from '$lib/stores';
	import { fade } from 'svelte/transition';
	import { openModal } from '$lib/components/util/modal';
	import WatchModal from '$lib/components/anime/WatchModal.svelte';
	import PlatformIcon from '$lib/components/anime/PlatformIcon.svelte';
	import { getAnimeTitle } from '$lib/util';

	const mqMobile = new MediaQuery('(max-width: 767px)');

	let { data }: PageProps = $props();
	let images = getAnimeImagesStore();
	let searchInput: string = $state('');
	let displayAmount = $state(24);

	let sortedAnime = $derived.by(() => {
		// Multi-key sort: English, Romaji, Native.
		const keys = ['titleEnglish', 'titleRomaji', 'titleNative'] as const;
		return [...data.anime].sort((a, b) => {
			for (const key of keys) {
				const av = a[key];
				const bv = b[key];
				if (av == null && bv == null) continue;
				if (av == null) return 1;
				if (bv == null) return -1;
				const cmp = av.localeCompare(bv);
				if (cmp !== 0) return cmp;
			}
			return 0;
		});
	});

	let modalData = $state<AnimeCard | null>(null);
	let hoveredAnimeId: string | null = $state(null);

	let cardPositions: Record<string, 'bottom' | 'top'> = $state({});

	// Fuse index is rebuilt only when the underlying list changes, not per keystroke.
	const fuse = $derived(
		new Fuse(sortedAnime, {
			keys: ['titleEnglish', 'titleNative', 'titleRomaji', 'genres'],
			threshold: 0.3,
			ignoreLocation: true,
			minMatchCharLength: 2
		})
	);

	let filteredAnime = $derived.by(() => {
		if (!searchInput || searchInput.length < 2) {
			return sortedAnime;
		}
		return fuse.search(searchInput).map((result) => result.item);
	});

	function getAniListUrl(anilistId: number | null): string | null {
		return anilistId ? `https://anilist.co/anime/${anilistId}` : null;
	}

	function getMalUrl(malId: number | null): string | null {
		return malId ? `https://myanimelist.net/anime/${malId}` : null;
	}

	function getAnimeImage(anilistId: number | null) {
		return images.value.find((x) => x.id === anilistId);
	}

	function handleListItemHover(event: MouseEvent, animeId: string) {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const cardHeight = 400;
		const spaceBelow = window.innerHeight - rect.bottom;

		cardPositions = {
			...cardPositions,
			[animeId]: spaceBelow < cardHeight ? 'top' : 'bottom'
		};
	}
</script>

<svelte:head>
	<title>Anime list | G.O.T Archive</title>
	<meta
		name="description"
		content="Explore the anime list on G.O.T Archive, featuring detailed information and links to watch."
	/>
</svelte:head>

{#snippet animeListRow(details: AnimeCard)}
	{@const image = getAnimeImage(details.external.anilistId)}
	{@const position = cardPositions[details.animeId] ?? 'bottom'}
	<li
		class="list-row hover:bg-base-200 transition-all duration-75"
		onmouseenter={(e) => {
			handleListItemHover(e, details.animeId);
			hoveredAnimeId = details.animeId;
		}}
		onmouseleave={() => (hoveredAnimeId = null)}
	>
		<div>
			{#if image}
				<img
					loading="lazy"
					decoding="async"
					src={image.coverImage.medium}
					alt={getAnimeTitle(details, 'Anime cover')}
					class="rounded-box size-10 object-cover"
				/>
			{/if}
		</div>
		<a
			href={`/gotgames/anime/${details.animeId}`}
			class="hover:text-primary transition-colors duration-150 max-md:flex max-md:items-center"
		>
			<div>{details.titleEnglish}</div>
			{#if mqMobile.current === false}
				<div class="text-xs opacity-60">{details.titleNative}</div>
			{/if}
		</a>
		{#if mqMobile.current === false}
			<div class="flex items-center">
				<span>{details.totalEpisodesWatched ?? 0}/{details.totalEpisodes ?? '?'} eps</span>
			</div>
		{/if}
		{#if details.external.anilistId && !mqMobile.current}
			<div>
				<a
					class={['*:fill-base-content *:size-4', 'flex items-center justify-center', 'btn invert']}
					href={getAniListUrl(details.external.anilistId)}
					target="_blank"
					rel="noopener noreferrer"
				>
					<PlatformIcon platform="anilist" />
				</a>
			</div>
		{/if}
		{#if details.external.malId && !mqMobile.current}
			<div>
				<a
					class={['*:fill-base-content *:size-4', 'flex items-center justify-center', 'btn invert']}
					href={getMalUrl(details.external.malId)}
					target="_blank"
					rel="noopener noreferrer"
				>
					<PlatformIcon platform="mal" />
				</a>
			</div>
		{/if}
		<div>
			{#if !mqMobile.current}
				<button
					class="btn btn-primary"
					aria-label="Watch playlists"
					onclick={() => {
						modalData = details;
						openModal('watch_modal');
					}}
				>
					<ListVideo class="h-3 w-3" />
				</button>
			{:else}
				<button
					class="btn btn-sm btn-primary"
					onclick={(e) => {
						if (hoveredAnimeId === details.animeId) {
							hoveredAnimeId = null;
						} else {
							handleListItemHover(e, details.animeId);
							hoveredAnimeId = details.animeId;
						}
					}}
				>
					<ChevronDown
						class="size-4 transition-all duration-150 {hoveredAnimeId === details.animeId
							? 'rotate-180'
							: ''}"
					/>
				</button>
			{/if}
		</div>
		{#if hoveredAnimeId === details.animeId}
			<div
				class={[
					'card bg-base-300 w-full max-w-96 min-w-80',
					'absolute left-1/2 -translate-x-1/2',
					position === 'top' ? 'bottom-full mb-6' : 'top-full mt-2',
					'z-30'
				]}
				transition:fade={{ duration: 150 }}
			>
				<figure class="h-24">
					<img
						loading="lazy"
						decoding="async"
						src={image?.bannerImage || image?.coverImage.extraLarge || image?.coverImage.medium}
						alt={getAnimeTitle(details, 'Anime cover')}
						class="h-full w-full object-cover"
					/>
				</figure>
				<div class="card-body">
					<h2 class="card-title">{details.titleEnglish}</h2>
					<div class="flex flex-wrap gap-1">
						{#each details.genres as genre}
							<div class="badge badge-primary">{genre}</div>
						{/each}
					</div>
					{#if mqMobile.current}
						<div>
							<span>{details.totalEpisodesWatched ?? 0}/{details.totalEpisodes ?? '?'} eps</span>
						</div>
						<div class="card-actions justify-end">
							{#if details.external.anilistId}
								<div>
									<a
										class={[
											'*:fill-base-content *:size-4',
											'flex items-center justify-center',
											'btn invert'
										]}
										href={getAniListUrl(details.external.anilistId)}
										target="_blank"
										rel="noopener noreferrer"
									>
										<PlatformIcon platform="anilist" />
									</a>
								</div>
							{/if}
							{#if details.external.malId}
								<div>
									<a
										class={[
											'*:fill-base-content *:size-4',
											'flex items-center justify-center',
											'btn invert'
										]}
										href={getMalUrl(details.external.malId)}
										target="_blank"
										rel="noopener noreferrer"
									>
										<PlatformIcon platform="mal" />
									</a>
								</div>
							{/if}
							<button
								class="btn btn-primary"
								aria-label="Watch playlists"
								onclick={() => {
									modalData = details;
									openModal('watch_modal');
								}}
							>
								<ListVideo class="h-3 w-3" />
							</button>
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</li>
{/snippet}

<div class="container mx-auto max-w-7xl p-2 md:p-4">
	<!-- Header -->
	<div class="mb-4">
		<h1 class="mb-3 text-center text-2xl font-bold md:text-3xl">Anime Collection</h1>

		<div class="flex flex-col items-center gap-2 sm:flex-row">
			<div class="join w-full">
				<label class="join-item input flex w-full items-center gap-2">
					<Search class="h-4 w-4 opacity-70" />
					<input type="text" bind:value={searchInput} placeholder="Search anime..." class="grow" />
				</label>
				<button class="join-item btn btn-primary" onclick={() => (searchInput = '')}>
					<X class="size-4" />
				</button>
			</div>

			<!-- Toggle -->
			<div class="join flex w-fit justify-center">
				<button class="btn join-item btn-active" title="Simple list">
					<List class="h-4 w-4" />
					{#if !mqMobile.current}
						<span class="ml-1">List</span>
					{/if}
				</button>
			</div>
		</div>

		<!-- Count -->
		<p class="text-base-content/70 mt-2 text-center text-xs md:text-sm">
			Showing {Math.min(displayAmount, filteredAnime.length)} of {filteredAnime.length} anime
			{#if searchInput && searchInput.length >= 2}
				(filtered from {sortedAnime.length})
			{/if}
		</p>
	</div>

	<!-- List -->
	<ul class="list bg-base-100 rounded-box mb-2 shadow-md">
		{#each filteredAnime.slice(0, displayAmount) as anime}
			{@render animeListRow(anime)}
		{/each}
	</ul>

	<!-- More -->
	{#if displayAmount < filteredAnime.length}
		<div class="flex justify-center">
			<button
				class="btn btn-primary"
				onclick={() => {
					displayAmount += 24;
				}}
			>
				Load More
			</button>
		</div>
	{:else if filteredAnime.length === 0}
		<div class="py-12 text-center">
			<p class="text-base-content/70 text-base md:text-lg">No anime found matching your search.</p>
		</div>
	{/if}
</div>

<!-- Watch -->
<WatchModal anime={modalData} onclose={() => (modalData = null)} />
