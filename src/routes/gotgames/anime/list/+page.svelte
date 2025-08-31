<script lang="ts">
	import type { PageProps } from './$types';
	import type { AnimeCard } from '../types';
	import { MediaQuery } from 'svelte/reactivity';
	import Fuse from 'fuse.js';
	import _ from 'lodash';
	import { Input, Button } from '$lib/components/forms/';
	import * as Suspense from '$lib/components/ui/suspense';
	import { Search, ListVideo, Grid2x2, Grid3x3, Link2 } from 'lucide-svelte';
	import { extractId } from '$lib/anilist/';
	import { getAnimeImagesStore } from '$lib/stores';
	import { toast } from '$lib/components/ui/toaster';

	const mqBannerImage = new MediaQuery('max-width: 63.999rem');

	let { data }: PageProps = $props();
	let images = getAnimeImagesStore();
	let searchInput: string = $state('');
	let displayType: 'more' | 'less' = $state('more');
	let displayAmount = $state(24);

	let modalData = $state<AnimeCard | null>(null);

	let mediumLoaded: Record<number, boolean> = $state({});
	let extraLargeLoaded: Record<number, boolean> = $state({});

	function handleMediumLoad(id: number) {
		mediumLoaded = { ...mediumLoaded, [id]: true };
	}

	function handleExtraLargeLoad(id: number) {
		extraLargeLoaded = { ...extraLargeLoaded, [id]: true };
	}

	function filterAnime(anime: Array<AnimeCard>): Array<AnimeCard> {
		const normalizedInput = _.deburr(searchInput);

		if (normalizedInput.length < 2) {
			return anime;
		}

		const animeWithNotes = anime.map((a) => ({
			...a,
			allNotes: a.links.map((link) => link[1]).filter((note) => !!note)
		}));

		const fuse = new Fuse(animeWithNotes, {
			keys: ['titleEnglish', 'titleNative', 'titleRomaji', 'allNotes'],
			threshold: 0.2,
			ignoreLocation: true,
			minMatchCharLength: 2
		});

		const result = fuse.search(normalizedInput);
		return result.map((r) => _.omit(r.item, 'allNotes'));
	}
</script>

<svelte:head>
	<title>Anime list | G.O.T Archive</title>
	<meta
		name="description"
		content="Explore the anime list on G.O.T Archive, featuring detailed information and links to watch."
	/>
</svelte:head>

{#snippet card(details: AnimeCard)}
	<div class="bg-base-300 card card-side shadow-sm">
		<figure class="h-60 w-45 shrink-0">
			{#if images.value.find((x) => x.id)}
				{#key extractId(details.mainSeason)}
					{#if !extraLargeLoaded[extractId(details.mainSeason) ?? 0]}
						<img
							loading="lazy"
							alt={`Medium cover image for ${details.titleEnglish || details.titleRomaji || details.titleNative}`}
							src={images.value.find((x) => x.id === extractId(details.mainSeason))?.coverImage
								.medium || ''}
							onload={() => handleMediumLoad(extractId(details.mainSeason) ?? 0)}
						/>
					{/if}
					{#if mediumLoaded[extractId(details.mainSeason) ?? 0]}
						<img
							loading="lazy"
							class={[
								extraLargeLoaded[extractId(details.mainSeason) ?? 0]
									? 'opacity-100'
									: 'absolute opacity-0'
							]}
							src={images.value.find((x) => x.id === extractId(details.mainSeason))?.coverImage
								.extraLarge || ''}
							alt={`Cover image for ${details.titleEnglish}`}
							onload={() => handleExtraLargeLoad(extractId(details.mainSeason) ?? 0)}
						/>
					{/if}
				{/key}
			{:else}
				<Suspense.Image />
			{/if}
		</figure>
		<div class="card-body">
			<a href={`/gotgames/anime/${details.animeId}`} class="card-title link text-xl font-bold">
				{details.titleEnglish ?? details.titleRomaji ?? details.titleNative ?? ''}
			</a>
			<div class="flex flex-wrap gap-1">
				{#each details.genres as genre}
					<div class="badge badge-accent">{genre}</div>
				{/each}
			</div>
			<p>
				Watched: {details.totalEpisodesWatched}/{details.totalEpisodes}
			</p>
			<div class="card-actions justify-end">
				<button
					class="btn btn-primary"
					onclick={() => {
						modalData = details;
						(document.getElementById('watch_modal') as HTMLDialogElement).showModal();
					}}
				>
					Watch
				</button>
				<a class="btn btn-primary" href={details.mainSeason} target="_blank"> AniList </a>
			</div>
		</div>
	</div>
{/snippet}

{#snippet cardLess(details: AnimeCard)}
	<div class="card image-full h-60">
		<figure>
			{#if images.value.find((x) => x.id)}
				<img
					loading="lazy"
					src={images.value.find((x) => x.id === extractId(details.mainSeason))?.bannerImage || ''}
					alt={`Cover image for ${details.titleEnglish || details.titleRomaji || details.titleNative}`}
				/>
			{:else}
				<Suspense.Image />
			{/if}
		</figure>
		<div class="card-body">
			<a href={`/gotgames/anime/${details.animeId}`} class="card-title link text-xl font-bold">
				{details.titleEnglish ?? details.titleRomaji ?? details.titleNative ?? ''}
			</a>
			<div class="flex flex-wrap gap-2">
				{#each details.genres as genre}
					<div class="badge badge-accent">{genre}</div>
				{/each}
			</div>
			<p>
				Watched: {details.totalEpisodesWatched}/{details.totalEpisodes}
			</p>
			<div class="card-actions justify-end">
				<button
					class="btn btn-primary"
					onclick={() => {
						modalData = details;
						(document.getElementById('watch_modal') as HTMLDialogElement).showModal();
					}}
				>
					Watch
				</button>
				<a class="btn btn-primary" href={details.mainSeason} target="_blank"> AniList </a>
			</div>
		</div>
	</div>
{/snippet}

<div class="flex flex-col justify-center gap-2">
	<div class="join w-full">
		<label class="input join-item w-full">
			<span class="label">Search</span>
			<input type="text" bind:value={searchInput} />
		</label>
		{#if displayType === 'more'}
			<button class="join-item btn btn-primary" onclick={() => (displayType = 'less')}>
				<Grid3x3 />
			</button>
		{:else}
			<button class="join-item btn btn-primary" onclick={() => (displayType = 'more')}>
				<Grid2x2 />
			</button>
		{/if}
	</div>
	<div
		class={[
			'grid gap-2',
			displayType === 'more' &&
				!mqBannerImage.current &&
				'grid-cols-1 md:grid-cols-2 2xl:grid-cols-3',
			(displayType === 'less' || mqBannerImage.current) &&
				'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4'
		]}
	>
		{#each _.take(filterAnime(data.anime), displayAmount) as a}
			{#if displayType === 'more' && !mqBannerImage.current}
				{@render card(a)}
			{:else}
				{@render cardLess(a)}
			{/if}
		{/each}
	</div>
	<button
		class="btn btn-primary"
		onclick={() => {
			if (displayAmount < data.anime.length) {
				displayAmount += 24;
			} else {
				toast.info('No more anime to show!');
			}
		}}
	>
		<span class="font-bold">Show more</span>
	</button>
	<dialog class="modal" id="watch_modal">
		{#if modalData}
			<div class="modal-box bg-base-300 flex flex-col gap-1">
				{#each modalData.links.filter((x) => x[0] != 'NULL') as link}
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
