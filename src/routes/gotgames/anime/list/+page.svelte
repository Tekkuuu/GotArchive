<script lang="ts">
	import type { PageProps } from './$types';
	import type { AnimeCard } from '../types';
	import { MediaQuery } from 'svelte/reactivity';
	import Fuse from 'fuse.js';
	import _ from 'lodash';
	import * as Suspense from '$lib/components/ui/suspense';
	import { Search, List, ExternalLink, ListVideo, X, ChevronDown } from 'lucide-svelte';
	import { getAnimeImagesStore } from '$lib/stores';
	import { fade } from 'svelte/transition';

	const mqMobile = new MediaQuery('(max-width: 767px)');

	let { data }: PageProps = $props();
	let images = getAnimeImagesStore();
	let searchInput: string = $state('');
	let displayType: 'list' | 'more' | 'less' = $state('list');
	let displayAmount = $state(24);

  let sortedAnime = $derived.by(() => {
    return _.orderBy(data.anime, ['titleEnglish', 'titleRomaji', 'titleNative']);
  });

	let modalData = $state<AnimeCard | null>(null);
	let hoveredAnimeId: string | null = $state(null);

	// Track card position for viewport-aware positioning
	let cardPositions: Record<string, 'bottom' | 'top'> = $state({});

	// Derived filtered anime list with Fuse.js
	let filteredAnime = $derived.by(() => {
		if (!searchInput || searchInput.length < 2) {
			return sortedAnime;
		}
		const fuse = new Fuse(sortedAnime, {
			keys: ['titleEnglish', 'titleNative', 'titleRomaji', 'genres'],
			threshold: 0.3,
			ignoreLocation: true,
			minMatchCharLength: 2
		});
		return fuse.search(searchInput).map((result) => result.item);
	});

	// Build AniList URL from ID
	function getAniListUrl(anilistId: number | null): string | null {
		return anilistId ? `https://anilist.co/anime/${anilistId}` : null;
	}

	// Build MAL URL from ID
	function getMalUrl(malId: number | null): string | null {
		return malId ? `https://myanimelist.net/anime/${malId}` : null;
	}

	// Get anime image data
	function getAnimeImage(anilistId: number | null) {
		return images.value.find((x) => x.id === anilistId);
	}

	// Check if card should appear above or below based on viewport
	function handleListItemHover(event: MouseEvent, animeId: string) {
		const target = event.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const cardHeight = 400; // Approximate card height
		const spaceBelow = window.innerHeight - rect.bottom;
		
		// Position above if not enough space below
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
    onmouseleave={() => hoveredAnimeId = null}
  >
    <div>
      {#if image}
        <Suspense.LazyImage
          primary={image.coverImage.medium}
          secondary={image.coverImage.extraLarge}
          alt={details.titleEnglish || ""}
          class="size-10 rounded-box object-cover"
        />
      {/if}
    </div>
    <a href={`/gotgames/anime/${details.animeId}`} class="hover:text-primary transition-colors duration-150 max-md:flex max-md:items-center">
      <div>{details.titleEnglish}</div>
      {#if mqMobile.current === false}
        <div class="opacity-60 text-xs">{details.titleNative}</div>
      {/if}
    </a >
    {#if mqMobile.current === false}
      <div class="flex items-center">
        <span>{details.totalEpisodesWatched ?? 0}/{details.totalEpisodes ?? '?'} eps</span>
      </div>
    {/if}
    {#if details.external.anilistId && !mqMobile.current}
      <div>
        <a
          class={[
            "*:fill-base-content *:size-4",
            "flex items-center justify-center",
            "btn invert"
          ]}
          href={getAniListUrl(details.external.anilistId)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <title>AniList</title>
            <path d="M24 17.53v2.421c0 .71-.391 1.101-1.1 1.101h-5l-.057-.165L11.84 3.736c.106-.502.46-.788 1.053-.788h2.422c.71 0 1.1.391 1.1 1.1v12.38H22.9c.71 0 1.1.392 1.1 1.101zM11.034 2.947l6.337 18.104h-4.918l-1.052-3.131H6.019l-1.077 3.131H0L6.361 2.948h4.673zm-.66 10.96-1.69-5.014-1.541 5.015h3.23z"/>
          </svg>
        </a>
      </div>
    {/if}
    {#if details.external.malId && !mqMobile.current}
      <div>
        <a
          class={[
            "*:fill-base-content *:size-4",
            "flex items-center justify-center",
            "btn invert"
          ]}
          href={getMalUrl(details.external.malId)}
          target="_blank"
          rel="noopener noreferrer"
        >
          <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <title>Malwarebytes</title>
            <path d="M10.87 22.9027c.1571 0 .2796-.1236.2796-.2824 0-.124-.0874-.2828-.2445-.2828h-.088l-.1926-.0352c-3.2382-.636-5.6358-3.5505-5.6358-6.96 0-1.4478.4376-2.8256 1.19-3.938.1229-.1593.315-.2828.5254-.0884l5.1113 5.2277c.0342.0352.122.0883.1921.0883.0875 0 .1576-.0353.1927-.0883l5.1458-5.1924c.1927-.1944.368-.1588.473.0352a7.1 7.1 0 0 1 1.19 3.9385c0 1.819-.6826 3.4622-1.8032 4.7164-.0347.0353-.087.0883-.1222.1236 0 .0353-.035.0883-.035.1235 0 .1593.1225.2828.28.2828h.0351c.035 0 .0875-.0352.1225-.0352 6.8262-2.897 6.5116-9.75 6.5116-9.75 0-3.9036-1.8384-7.4184-4.6737-9.6263-.1224-.0883-.3151-.0883-.403.0352l-6.7033 6.8534c-.1228.1235-.3154.1235-.4376 0L5.0234 1.1949c-.1225-.1235-.2797-.1235-.4022-.0352C1.8379 3.3676 0 6.8293 0 10.786c0 6.2875 4.7086 11.4806 10.7825 12.1167Z"/>
          </svg>
        </a>
      </div>
    {/if}
    <div>
      {#if !mqMobile.current}
        <button class="btn btn-primary" onclick={() => {
          modalData = details;
          (document.getElementById('watch_modal') as HTMLDialogElement).showModal();
        }}>
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
            class="size-4 transition-all duration-150 {(hoveredAnimeId === details.animeId) ? "rotate-180" : ""}"
          />
        </button>
      {/if}
    </div>
    {#if hoveredAnimeId === details.animeId}
      <div
        class={[
          "card bg-base-300 min-w-80 max-w-96 w-full",
          "absolute left-1/2 -translate-x-1/2",
          position === 'top' ? 'bottom-full mb-6' : 'top-full mt-2',
          "z-50"
        ]}
        transition:fade={{ duration: 150 }}
      >
        <figure class="h-24">
          <Suspense.LazyImage
            primary={image?.coverImage.medium || ''}
            secondary={image?.bannerImage || image?.coverImage.extraLarge || ''}
            alt={details.titleEnglish || ""}
            class="object-cover w-full h-full"
            fallbackClass="w-full h-full"
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
                      "*:fill-base-content *:size-4",
                      "flex items-center justify-center",
                      "btn invert"
                    ]}
                    href={getAniListUrl(details.external.anilistId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <title>AniList</title>
                      <path d="M24 17.53v2.421c0 .71-.391 1.101-1.1 1.101h-5l-.057-.165L11.84 3.736c.106-.502.46-.788 1.053-.788h2.422c.71 0 1.1.391 1.1 1.1v12.38H22.9c.71 0 1.1.392 1.1 1.101zM11.034 2.947l6.337 18.104h-4.918l-1.052-3.131H6.019l-1.077 3.131H0L6.361 2.948h4.673zm-.66 10.96-1.69-5.014-1.541 5.015h3.23z"/>
                    </svg>
                  </a>
                </div>
              {/if}
              {#if details.external.malId}
                <div>
                  <a
                    class={[
                      "*:fill-base-content *:size-4",
                      "flex items-center justify-center",
                      "btn invert"
                    ]}
                    href={getMalUrl(details.external.malId)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <title>Malwarebytes</title>
                      <path d="M10.87 22.9027c.1571 0 .2796-.1236.2796-.2824 0-.124-.0874-.2828-.2445-.2828h-.088l-.1926-.0352c-3.2382-.636-5.6358-3.5505-5.6358-6.96 0-1.4478.4376-2.8256 1.19-3.938.1229-.1593.315-.2828.5254-.0884l5.1113 5.2277c.0342.0352.122.0883.1921.0883.0875 0 .1576-.0353.1927-.0883l5.1458-5.1924c.1927-.1944.368-.1588.473.0352a7.1 7.1 0 0 1 1.19 3.9385c0 1.819-.6826 3.4622-1.8032 4.7164-.0347.0353-.087.0883-.1222.1236 0 .0353-.035.0883-.035.1235 0 .1593.1225.2828.28.2828h.0351c.035 0 .0875-.0352.1225-.0352 6.8262-2.897 6.5116-9.75 6.5116-9.75 0-3.9036-1.8384-7.4184-4.6737-9.6263-.1224-.0883-.3151-.0883-.403.0352l-6.7033 6.8534c-.1228.1235-.3154.1235-.4376 0L5.0234 1.1949c-.1225-.1235-.2797-.1235-.4022-.0352C1.8379 3.3676 0 6.8293 0 10.786c0 6.2875 4.7086 11.4806 10.7825 12.1167Z"/>
                    </svg>
                  </a>
                </div>
              {/if}
              <button class="btn btn-primary" onclick={() => {
                modalData = details;
                (document.getElementById('watch_modal') as HTMLDialogElement).showModal();
              }}>
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
	<!-- Header and Search -->
	<div class="mb-4">
		<h1 class="text-2xl md:text-3xl font-bold text-center mb-3">Anime Collection</h1>

		<div class="flex flex-col items-center sm:flex-row gap-2">
      <div class="join w-full">
        <label class="join-item input flex w-full items-center gap-2">
          <Search class="h-4 w-4 opacity-70" />
          <input
            type="text"
            bind:value={searchInput}
            placeholder="Search anime..."
            class="grow"
          />
        </label>
        <button class="join-item btn btn-primary" onclick={() => (searchInput = '')}>
          <X class="size-4" />
        </button>
      </div>

			<!-- Display Type Toggle -->
			<div class="join w-fit flex justify-center">
				<button
					class="btn join-item {displayType === 'list' ? 'btn-active' : ''}"
					onclick={() => (displayType = 'list')}
					title="Simple list"
				>
					<List class="h-4 w-4" />
					{#if !mqMobile.current}
						<span class="ml-1">List</span>
					{/if}
				</button>
        <!-- TODO: Implement other display types -->
				<!-- <button -->
				<!-- 	class="btn join-item {displayType === 'more' ? 'btn-active' : ''}" -->
				<!-- 	onclick={() => (displayType = 'more')} -->
				<!-- 	title="More details" -->
				<!-- > -->
				<!-- 	<Grid2x2 class="h-4 w-4" /> -->
				<!-- 	{#if !mqMobile.current} -->
				<!-- 		<span class="ml-1">More</span> -->
				<!-- 	{/if} -->
				<!-- </button> -->
				<!-- <button -->
				<!-- 	class="btn join-item {displayType === 'less' ? 'btn-active' : ''}" -->
				<!-- 	onclick={() => (displayType = 'less')} -->
				<!-- 	title="Compact cards" -->
				<!-- > -->
				<!-- 	<Grid3x3 class="h-4 w-4" /> -->
				<!-- 	{#if !mqMobile.current} -->
				<!-- 		<span class="ml-1">Cards</span> -->
				<!-- 	{/if} -->
				<!-- </button> -->
			</div>
		</div>

		<!-- Results count -->
		<p class="text-xs md:text-sm text-base-content/70 mt-2 text-center">
			Showing {Math.min(displayAmount, filteredAnime.length)} of {filteredAnime.length} anime
			{#if searchInput && searchInput.length >= 2}
				(filtered from {sortedAnime.length})
			{/if}
		</p>
	</div>

	<!-- Anime Grid/List -->
  {#if displayType === 'list'}
    <ul class="list bg-base-100 rounded-box shadow-md mb-2">
      {#each _.take(filteredAnime, displayAmount) as anime}
        {@render animeListRow(anime)}
      {/each}
    </ul>
  {/if}

	<!-- Load More Button -->
	{#if displayAmount < filteredAnime.length}
		<div class="flex justify-center">
			<button
				class="btn btn-primary"
				onclick={() => {
          displayAmount += 24
				}}
			>
				Load More
			</button>
		</div>
	{:else if filteredAnime.length === 0}
		<div class="text-center py-12">
			<p class="text-base md:text-lg text-base-content/70">
				No anime found matching your search.
			</p>
		</div>
	{/if}
</div>

<!-- Watch Modal (Playlist Popup) -->
<dialog class="modal" id="watch_modal">
	{#if modalData}
		<div class="modal-box bg-base-200 max-w-md">
			<h3 class="font-bold text-base md:text-lg mb-3">
				{modalData.titleEnglish ?? modalData.titleRomaji ?? modalData.titleNative}
			</h3>

			{#if modalData.links.length === 0}
				<p class="text-base-content/70 text-center py-4">No playlists available.</p>
			{:else}
				<div class="flex flex-col gap-2">
					<p class="text-sm text-base-content/70 mb-1">Available Playlists:</p>
					{#each modalData.links as [url, note]}
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
						modalData = null;
					}}
				>
					Close
				</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => (modalData = null)}>close</button>
		</form>
	{/if}
</dialog>
