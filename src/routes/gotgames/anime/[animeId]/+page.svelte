<script lang="ts">
	import _ from 'lodash';
	import { page } from '$app/state';
	import type { PageProps } from './$types';
	import type { AnimeCard } from '../types';
	import { LinkButton, Button } from '$lib/components/forms/';
	import { Modal } from '$lib/components/ui/';
	import { ListVideo } from 'lucide-svelte';
	import { getAnimeImagesStore, updateAnimeImagesStore } from '$lib/stores/';
	import { MediaQuery } from 'svelte/reactivity';
	import { extractId } from '$lib/anilist/util';
	import * as Suspense from '$lib/components/ui/suspense';
	import { onMount } from 'svelte';

	const mqMaxSm = new MediaQuery('max-width: 39.999rem');

	let { data }: PageProps = $props();
	let anime = $derived(data.anime.find((a) => a.animeId === Number(page.params.animeId)));
	let seasons = $derived(data.seasons);

	let images = getAnimeImagesStore();

	let modalOpen = $state(false);

	let mediumLoaded: Record<number, boolean> = $state({});
	let extraLargeLoaded: Record<number, boolean> = $state({});

	function handleMediumLoad(id: number) {
		mediumLoaded = { ...mediumLoaded, [id]: true };
	}

	function handleExtraLargeLoad(id: number) {
		extraLargeLoaded = { ...extraLargeLoaded, [id]: true };
	}

	onMount(() => {
		const ids = seasons.map((s) => extractId(s.anilistLink)).filter((s) => s !== null);
		updateAnimeImagesStore(ids).catch((error) => {
			console.error('Failed to update anime images store:', error);
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

{#snippet animeCard(details: AnimeCard)}
	<div class="card bg-base-300">
		<figure>
			{#if images.value.find((x) => x.id)}
				<img
					loading="lazy"
					src={images.value.find((x) => x.id === extractId(details.mainSeason))?.bannerImage || ''}
					alt={`Banner image for ${details.titleEnglish || details.titleRomaji || details.titleNative}`}
				/>
			{:else}
				<Suspense.Image />
			{/if}
		</figure>
		<div class="card-body">
			<h2 class="card-title">
				{details.titleEnglish ?? details.titleRomaji ?? details.titleNative}
			</h2>
			<div class="flex flex-col gap-1">
				<p class="text-primary-600 dark:text-primary-400 text-xs">
					{details.titleNative}
				</p>
				<div class="flex flex-wrap gap-1">
					{#each details.genres as genre}
						<span class="badge badge-accent">{genre}</span>
					{/each}
				</div>
				<p>
					Watched: {details.totalEpisodesWatched}/{details.totalEpisodes}
				</p>
			</div>
			<div class="card-actions justify-end">
				<button
					class="btn btn-primary"
					onclick={() => {
						(document.getElementById('watch_modal') as HTMLDialogElement).showModal();
					}}
				>
					Watch
				</button>
				<a href={details.mainSeason} target="_blank" class="btn btn-primary">AniList</a>
			</div>
		</div>
	</div>
{/snippet}

{#snippet seasonCard(details: (typeof seasons)[number])}
	<div class={['card sm:card-side bg-base-300', mqMaxSm.current && 'image-full']}>
		<figure class="sm:h-60 sm:w-45 sm:shrink-0">
			{#if images.value.find((x) => x.id)}
				{#key extractId(details.anilistLink)}
					{#if !extraLargeLoaded[extractId(details.anilistLink) ?? 0]}
						<img
							loading="lazy"
							alt={`Medium cover image for ${details.titleEnglish || details.titleRomaji || details.titleNative}`}
							src={mqMaxSm.current
								? images.value.find((x) => x.id === extractId(details.anilistLink))?.bannerImage ||
									''
								: images.value.find((x) => x.id === extractId(details.anilistLink))?.coverImage
										.medium || ''}
							onload={() => handleMediumLoad(extractId(details.anilistLink) ?? 0)}
						/>
					{/if}
					{#if mediumLoaded[extractId(details.anilistLink) ?? 0]}
						<img
							loading="lazy"
							class={[
								extraLargeLoaded[extractId(details.anilistLink) ?? 0]
									? 'opacity-100'
									: 'absolute opacity-0'
							]}
							src={mqMaxSm.current
								? images.value.find((x) => x.id === extractId(details.anilistLink))?.bannerImage ||
									''
								: images.value.find((x) => x.id === extractId(details.anilistLink))?.coverImage
										.extraLarge || ''}
							alt={`Cover image for ${details.titleEnglish}`}
							onload={() => handleExtraLargeLoad(extractId(details.anilistLink) ?? 0)}
						/>
					{/if}
				{/key}
			{:else}
				<Suspense.Image />
			{/if}
		</figure>

		<div class="card-body">
			<h2 class="card-title">
				{details.titleEnglish ?? details.titleRomaji ?? details.titleNative}
			</h2>
			<p>
				<span class="inline-flex w-full justify-between">
					Released: {_.capitalize(details.season ?? 'N/A')}
					{details.year}
					<span
						class={[
							'badge',
							details.status === 'Completed' && 'badge-success',
							details.status === 'Watching' && 'badge-primary',
							details.status === 'Paused' && 'badge-warning'
						]}
					>
						{details.status}
					</span>
				</span>
				<br />
				Format: {details.format}
				<br />
				Watched: {details.watchedInSeason}/{details.episodes}
			</p>
			<div class="card-actions justify-end">
				<a href={details.anilistLink} target="_blank" class="btn btn-primary">View on AniList</a>
			</div>
		</div>
	</div>
{/snippet}

<div class="flex flex-col justify-center gap-2">
	{#if anime !== undefined}
		{@render animeCard(anime)}
	{/if}
	<div class={['grid grid-cols-1 gap-2', seasons.length !== 1 && 'lg:grid-cols-2']}>
		{#each seasons.sort((a, b) => a.sequence - b.sequence) as season}
			{@render seasonCard(season)}
		{/each}
	</div>
	<dialog class="modal" id="watch_modal">
		{#if anime}
			<div class="modal-box bg-base-300 flex flex-col gap-1">
				{#each anime.links.filter((x) => x[0] != 'NULL') as link}
					<a href={link[0]} class="btn btn-primary">
						<ListVideo />
						<span class="flex items-center justify-center gap-1">
							{link[0].includes('youtube') ? 'YouTube' : 'Patreon'}
							{#if link[1]}
								({link[1]})
							{/if}
						</span>
					</a>
				{/each}
				<div class="modal-action">
					<button
						class="btn"
						onclick={() => (document.getElementById('watch_modal') as HTMLDialogElement).close()}
					>
						Close
					</button>
				</div>
			</div>
		{/if}
	</dialog>
</div>
