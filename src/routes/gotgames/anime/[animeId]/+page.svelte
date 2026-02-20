<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';
	import { MediaQuery } from 'svelte/reactivity';
	import _ from 'lodash';
	import * as Suspense from '$lib/components/ui/suspense';
	import { ExternalLink, ListVideo, Calendar, TrendingUp } from 'lucide-svelte';
	import { getAnimeImagesStore, updateAnimeImagesStore } from '$lib/stores';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { logError } from '$lib/client/logger';

	const mqMaxSm = new MediaQuery('max-width: 39.999rem');

	let { data }: PageProps = $props();
	let anime = $derived(data.anime.find((a) => a.animeId === page.params.animeId));
	let seasons = $derived(data.seasons);

	let images = getAnimeImagesStore();

	// Get AniList URL helper
	function getAniListUrl(anilistId: number | null): string | null {
		return anilistId ? `https://anilist.co/anime/${anilistId}` : null;
	}

	// Get MAL URL helper
	function getMalUrl(malId: number | null): string | null {
		return malId ? `https://myanimelist.net/anime/${malId}` : null;
	}

	// Get anime image data
	function getAnimeImage(anilistId: number | null) {
		return images.value.find((x) => x.id === anilistId);
	}

	onMount(() => {
		const ids = seasons.map((s) => s.anilistId).filter((s) => s !== null);
		updateAnimeImagesStore(ids).catch((error) => {
			logError('Failed to update anime images store', { error: String(error) });
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
		<!-- Anime Header Card -->
		<div class="card bg-base-200 shadow-lg" transition:fade={{ duration: 150 }}>
			<figure class="h-48 md:h-64">
				{#if headerImage}
					<Suspense.LazyImage
						primary={headerImage.bannerImage || ''}
						alt={`Banner image for ${anime.titleEnglish || anime.titleRomaji || anime.titleNative}`}
						class="object-cover w-full h-full"
					/>
				{:else}
					<Suspense.Image />
				{/if}
			</figure>
			<div class="card-body">
				<div class="flex flex-col md:flex-row gap-2 items-start md:items-center justify-between">
					<div class="flex-1">
						<h1 class="card-title text-2xl md:text-3xl">
							{anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative}
						</h1>
						<p class="text-base-content/70 text-sm md:text-base mt-1">
							{anime.titleRomaji}
						</p>
            <p class="text-base-content/70 text-sm md:text-base">
              {anime.titleNative}
            </p>
					</div>

					<!-- Quick Stats -->
					<div class="stats shadow stats-horizontal bg-base-300 max-md:self-center max-md:w-full">
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

				<!-- Action Buttons -->
				<div class="card-actions justify-end">
					{#if anime.external.anilistId}
						<a
							href={getAniListUrl(anime.external.anilistId)}
							target="_blank"
							rel="noopener noreferrer"
							class="btn invert btn-sm md:btn-md gap-1"
						>
							<svg
								class="size-4"
								role="img"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								fill="currentColor"
							>
								<title>AniList</title>
								<path
									d="M24 17.53v2.421c0 .71-.391 1.101-1.1 1.101h-5l-.057-.165L11.84 3.736c.106-.502.46-.788 1.053-.788h2.422c.71 0 1.1.391 1.1 1.1v12.38H22.9c.71 0 1.1.392 1.1 1.101zM11.034 2.947l6.337 18.104h-4.918l-1.052-3.131H6.019l-1.077 3.131H0L6.361 2.948h4.673zm-.66 10.96-1.69-5.014-1.541 5.015h3.23z"
								/>
							</svg>
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
							<svg
								class="size-4"
								role="img"
								viewBox="0 0 24 24"
								xmlns="http://www.w3.org/2000/svg"
								fill="currentColor"
							>
								<title>MyAnimeList</title>
								<path
									d="M10.87 22.9027c.1571 0 .2796-.1236.2796-.2824 0-.124-.0874-.2828-.2445-.2828h-.088l-.1926-.0352c-3.2382-.636-5.6358-3.5505-5.6358-6.96 0-1.4478.4376-2.8256 1.19-3.938.1229-.1593.315-.2828.5254-.0884l5.1113 5.2277c.0342.0352.122.0883.1921.0883.0875 0 .1576-.0353.1927-.0883l5.1458-5.1924c.1927-.1944.368-.1588.473.0352a7.1 7.1 0 0 1 1.19 3.9385c0 1.819-.6826 3.4622-1.8032 4.7164-.0347.0353-.087.0883-.1222.1236 0 .0353-.035.0883-.035.1235 0 .1593.1225.2828.28.2828h.0351c.035 0 .0875-.0352.1225-.0352 6.8262-2.897 6.5116-9.75 6.5116-9.75 0-3.9036-1.8384-7.4184-4.6737-9.6263-.1224-.0883-.3151-.0883-.403.0352l-6.7033 6.8534c-.1228.1235-.3154.1235-.4376 0L5.0234 1.1949c-.1225-.1235-.2797-.1235-.4022-.0352C1.8379 3.3676 0 6.8293 0 10.786c0 6.2875 4.7086 11.4806 10.7825 12.1167Z"
								/>
							</svg>
							<span class="hidden sm:inline">MyAnimeList</span>
						</a>
					{/if}
					{#if anime.links.length > 0}
						<button
							class="btn btn-primary btn-sm md:btn-md gap-1"
							onclick={() => {
								(document.getElementById('watch_modal') as HTMLDialogElement).showModal();
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
							{#key season.anilistId}
								<Suspense.LazyImage
									primary={mqMaxSm.current ? image.bannerImage || '' : image.coverImage.medium || ''}
									secondary={mqMaxSm.current ? image.bannerImage || '' : image.coverImage.extraLarge || ''}
									alt={`Cover image for ${season.titleEnglish || season.titleRomaji || season.titleNative}`}
									class="object-cover w-full h-full"
								/>
							{/key}
						{:else}
							<Suspense.Image />
						{/if}
					</figure>

					<div class="card-body p-4">
						<h3 class="card-title text-base md:text-lg">
							{season.titleEnglish ?? season.titleRomaji ?? season.titleNative}
						</h3>

						<div class="space-y-2 text-xs md:text-sm">
							<div class="flex items-center justify-between">
								<span class="flex items-center gap-1">
									<Calendar class="h-3.5 w-3.5" />
									{_.capitalize(season.season ?? 'N/A')} {season.year}
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

						<div class="card-actions justify-end mt-3">
							{#if season.anilistId}
								<a
									href={getAniListUrl(season.anilistId)}
									target="_blank"
									rel="noopener noreferrer"
									class="btn invert btn-xs md:btn-sm gap-1"
								>
                  <svg
                    class="size-4"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                  >
                    <title>AniList</title>
                    <path
                      d="M24 17.53v2.421c0 .71-.391 1.101-1.1 1.101h-5l-.057-.165L11.84 3.736c.106-.502.46-.788 1.053-.788h2.422c.71 0 1.1.391 1.1 1.1v12.38H22.9c.71 0 1.1.392 1.1 1.101zM11.034 2.947l6.337 18.104h-4.918l-1.052-3.131H6.019l-1.077 3.131H0L6.361 2.948h4.673zm-.66 10.96-1.69-5.014-1.541 5.015h3.23z"
                    />
                  </svg>
									<span class="hidden sm:inline">AniList</span>
								</a>
							{/if}
              {#if season.malId}
                <a
                  href={getMalUrl(season.malId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="btn invert btn-xs md:btn-sm gap-1"
                >
                  <svg
                    class="size-4"
                    role="img"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="currentColor"
                  >
                    <title>MyAnimeList</title>
                    <path
                      d="M10.87 22.9027c.1571 0 .2796-.1236.2796-.2824 0-.124-.0874-.2828-.2445-.2828h-.088l-.1926-.0352c-3.2382-.636-5.6358-3.5505-5.6358-6.96 0-1.4478.4376-2.8256 1.19-3.938.1229-.1593.315-.2828.5254-.0884l5.1113 5.2277c.0342.0352.122.0883.1921.0883.0875 0 .1576-.0353.1927-.0883l5.1458-5.1924c.1927-.1944.368-.1588.473.0352a7.1 7.1 0 0 1 1.19 3.9385c0 1.819-.6826 3.4622-1.8032 4.7164-.0347.0353-.087.0883-.1222.1236 0 .0353-.035.0883-.035.1235 0 .1593.1225.2828.28.2828h.0351c.035 0 .0875-.0352.1225-.0352 6.8262-2.897 6.5116-9.75 6.5116-9.75 0-3.9036-1.8384-7.4184-4.6737-9.6263-.1224-.0883-.3151-.0883-.403.0352l-6.7033 6.8534c-.1228.1235-.3154.1235-.4376 0L5.0234 1.1949c-.1225-.1235-.2797-.1235-.4022-.0352C1.8379 3.3676 0 6.8293 0 10.786c0 6.2875 4.7086 11.4806 10.7825 12.1167Z"
                    />
                  </svg>
                  <span class="hidden sm:inline">MyAnimeList</span>
                </a>
              {/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div class="text-center py-12">
			<p class="text-base md:text-lg text-base-content/70">Anime not found.</p>
		</div>
	{/if}
</div>

<!-- Watch Modal (Playlist Popup) -->
<dialog class="modal" id="watch_modal">
	{#if anime}
		<div class="modal-box bg-base-200 max-w-md">
			<h3 class="font-bold text-base md:text-lg mb-3">
				{anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative}
			</h3>

			{#if anime.links.length === 0}
				<p class="text-base-content/70 text-center py-4">No playlists available.</p>
			{:else}
				<div class="flex flex-col gap-2">
					<p class="text-sm text-base-content/70 mb-1">Available Playlists:</p>
					{#each anime.links as [url, note]}
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							class="btn btn-primary btn-sm justify-start"
						>
							<ListVideo class="h-4 w-4" />
							<span class="flex-1 text-left truncate">
								{#if url.includes('youtube')}
									YouTube
								{:else if url.includes('patreon')}
									Patreon
								{:else}
									Watch
								{/if}
								{#if note}
									<span class="text-xs opacity-70">({note})</span>
								{/if}
							</span>
							<ExternalLink class="h-3.5 w-3.5 opacity-70" />
						</a>
					{/each}
				</div>
			{/if}

			<div class="modal-action">
				<button
					class="btn btn-sm"
					onclick={() => {
						(document.getElementById('watch_modal') as HTMLDialogElement).close();
					}}
				>
					Close
				</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button>close</button>
		</form>
	{/if}
</dialog>
