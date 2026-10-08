<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';
	import { MediaQuery } from 'svelte/reactivity';
	import { ListVideo, Calendar, TrendingUp } from 'lucide-svelte';
	import { getAnimeImagesStore, updateAnimeImagesStore } from '$lib/stores';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import WatchModal from '$lib/components/anime/WatchModal.svelte';
	import PlatformIcon from '$lib/components/anime/PlatformIcon.svelte';
	import { openModal } from '$lib/components/util/modal';
	import { getAnimeTitle } from '$lib/util';

	/**
	 * Capitalizes string.
	 * @param str - Input.
	 * @returns Capitalized.
	 */
	function capitalize(str: string): string {
		return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
	}

	const mqMaxSm = new MediaQuery('max-width: 39.999rem');

	let { data }: PageProps = $props();
	let anime = $derived(data.anime.find((a) => a.animeId === page.params.animeId));
	let seasons = $derived(data.seasons);

	let images = getAnimeImagesStore();

	function getAniListUrl(anilistId: number | null): string | null {
		return anilistId ? `https://anilist.co/anime/${anilistId}` : null;
	}

	function getMalUrl(malId: number | null): string | null {
		return malId ? `https://myanimelist.net/anime/${malId}` : null;
	}

	function getAnimeImage(anilistId: number | null) {
		return images.value.find((x) => x.id === anilistId);
	}

	onMount(() => {
		const ids = seasons.map((s) => s.anilistId).filter((s) => s !== null);
		updateAnimeImagesStore(ids).catch((error) => {
			console.error('Failed to update anime images store', { error: String(error) });
		});
	});
</script>

<svelte:head>
	<title>
		{anime?.titleEnglish || anime?.titleRomaji || anime?.titleNative || 'Anime'} | G.O.T Archive
	</title>
	<meta
		name="description"
		content={`Details, schedule, and reactions for ${anime?.titleEnglish || anime?.titleRomaji || anime?.titleNative || 'this anime'} on G.O.T Archive. Discover episode timings, user reviews, and more.`}
	/>
</svelte:head>

<div class="container mx-auto max-w-7xl p-2">
	{#if anime}
		{@const headerImage = images.value.find((x) => x.id === anime.external.anilistId)}
		<!-- Header -->
		<div class="card bg-base-200 shadow-lg" transition:fade={{ duration: 150 }}>
			<figure class="h-48 md:h-64">
				{#if headerImage?.bannerImage}
					<img
						loading="lazy"
						decoding="async"
						src={headerImage.bannerImage}
						alt={`Banner image for ${anime.titleEnglish || anime.titleRomaji || anime.titleNative}`}
						class="h-full w-full object-cover"
					/>
				{:else}
					<div class="skeleton h-full w-full"></div>
				{/if}
			</figure>
			<div class="card-body">
				<div class="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
					<div class="flex-1">
						<h1 class="card-title text-2xl md:text-3xl">
							{getAnimeTitle(anime)}
						</h1>
						<p class="text-base-content/70 mt-1 text-sm md:text-base">
							{anime.titleRomaji}
						</p>
						<p class="text-base-content/70 text-sm md:text-base">
							{anime.titleNative}
						</p>
					</div>

					<!-- Stats -->
					<div class="stats stats-horizontal bg-base-300 shadow max-md:w-full max-md:self-center">
						<div class="stat p-2">
							<div class="stat-title text-xs">Progress</div>
							<div class="stat-value text-xl md:text-2xl">
								{anime.totalEpisodesWatched ?? 0}/{anime.totalEpisodes ?? '?'}
							</div>
							<div class="stat-desc text-xs">episodes</div>
						</div>
						<div class="stat p-2">
							<div class="stat-title text-xs">Seasons</div>
							<div class="stat-value text-xl md:text-2xl">{seasons.length}</div>
							<div class="stat-desc text-xs">total</div>
						</div>
					</div>
				</div>

				<!-- Genres -->
				<div class="flex flex-wrap gap-2">
					{#each anime.genres as genre}
						<div class="badge badge-primary badge-sm md:badge-md">{genre}</div>
					{/each}
				</div>

				<!-- Actions -->
				<div class="card-actions justify-end">
					{#if anime.external.anilistId}
						<a
							href={getAniListUrl(anime.external.anilistId)}
							target="_blank"
							rel="noopener noreferrer"
							class="btn btn-sm md:btn-md gap-1 invert"
						>
							<PlatformIcon platform="anilist" />
							<span class="hidden sm:inline">AniList</span>
						</a>
					{/if}
					{#if anime.external.malId}
						<a
							href={getMalUrl(anime.external.malId)}
							target="_blank"
							rel="noopener noreferrer"
							class="btn inverted btn-sm md:btn-md gap-1"
						>
							<PlatformIcon platform="mal" />
							<span class="hidden sm:inline">MyAnimeList</span>
						</a>
					{/if}
					{#if anime.links.length > 0}
						<button
							class="btn btn-primary btn-sm md:btn-md gap-1"
							onclick={() => {
								openModal('watch_modal');
							}}
						>
							<ListVideo class="h-4 w-4" />
							<span>Watch</span>
						</button>
					{/if}
				</div>
			</div>
		</div>

		<div class="mt-2 grid grid-cols-1 {seasons.length !== 1 ? 'lg:grid-cols-2' : ''} gap-2">
			{#each seasons.sort((a, b) => a.sequence - b.sequence) as season (season.animeSeasonId)}
				{@const image = getAnimeImage(season.anilistId)}
				<div
					class="card {mqMaxSm.current ? 'image-full' : 'sm:card-side'} bg-base-200 shadow-md"
					transition:fade={{ duration: 150 }}
				>
					<figure class="sm:h-60 sm:w-45 sm:shrink-0">
						{#if image}
							{@const coverSrc = mqMaxSm.current
								? image.bannerImage || image.coverImage.extraLarge || image.coverImage.medium
								: image.coverImage.extraLarge || image.coverImage.medium}
							{#if coverSrc}
								<img
									loading="lazy"
									decoding="async"
									src={coverSrc}
									alt={`Cover image for ${season.titleEnglish || season.titleRomaji || season.titleNative}`}
									class="h-full w-full object-cover"
								/>
							{:else}
								<div class="skeleton h-full w-full"></div>
							{/if}
						{:else}
							<div class="skeleton h-full w-full"></div>
						{/if}
					</figure>

					<div class="card-body p-4">
						<h3 class="card-title text-base md:text-lg">
							{getAnimeTitle(season)}
						</h3>

						<div class="space-y-2 text-xs md:text-sm">
							<div class="flex items-center justify-between">
								<span class="flex items-center gap-1">
									<Calendar class="h-3.5 w-3.5" />
									{capitalize(season.season ?? 'N/A')}
									{season.year}
								</span>
								<span
									class={[
										'badge badge-sm',
										season.status === 'Completed' && 'badge-success',
										season.status === 'Watching' && 'badge-primary',
										season.status === 'Paused' && 'badge-warning',
										season.status === 'Planning' && 'badge-ghost'
									]}
								>
									{season.status}
								</span>
							</div>

							<div class="flex items-center gap-1">
								<TrendingUp class="h-3.5 w-3.5" />
								Progress: {season.episodeProgress ?? 0}/{season.episodes ?? '?'} eps
							</div>

							<div>Format: {season.format}</div>
						</div>

						<div class="card-actions mt-3 justify-end">
							{#if season.anilistId}
								<a
									href={getAniListUrl(season.anilistId)}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-xs md:btn-sm gap-1 invert"
								>
									<PlatformIcon platform="anilist" />
									<span class="hidden sm:inline">AniList</span>
								</a>
							{/if}
							{#if season.malId}
								<a
									href={getMalUrl(season.malId)}
									target="_blank"
									rel="noopener noreferrer"
									class="btn btn-xs md:btn-sm gap-1 invert"
								>
									<PlatformIcon platform="mal" />
									<span class="hidden sm:inline">MyAnimeList</span>
								</a>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="py-12 text-center">
			<p class="text-base-content/70 text-base md:text-lg">Anime not found.</p>
		</div>
	{/if}
</div>

<!-- Watch -->
<WatchModal {anime} onclose={() => {}} />
