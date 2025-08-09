<script lang="ts">
	import type { PageProps } from './$types';
	import type { AnimeCard } from '../types';
	import { MediaQuery } from 'svelte/reactivity';
	import Fuse from 'fuse.js';
	import _ from 'lodash';
	import { LinkButton, Input, Button } from '$lib/components/forms/';
	import * as Suspense from '$lib/components/ui/suspense';
	import { Search, ListVideo, Grid2x2, Grid3x3, Link2 } from 'lucide-svelte';
	import { Modal } from '$lib/components/ui';
	import { extractId } from '$lib/anilist/';
	import { getAnimeImagesStore } from '$lib/stores';
	import { toast } from '$lib/components/ui/toaster';

	const mqBannerImage = new MediaQuery('max-width: 47.999rem');

	let { data }: PageProps = $props();
	let images = getAnimeImagesStore();
	let searchInput: string = $state('');
	let displayType: 'more' | 'less' = $state('more');
	let displayAmount = $state(16);

	let modalOpen = $state(false);
	let modalData = $state<AnimeCard | null>(null);

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
	<div class="dark:bg-primary-700 bg-primary-200 relative flex h-60 rounded-xl">
		<a
			href={details.mainSeason}
			class="relative flex h-full items-center max-md:absolute max-md:top-0 max-md:left-0 max-md:w-full md:p-2"
			target="_blank"
		>
			{#if images.value.find((x) => x.id)}
				<img
					class="block h-full w-full rounded-lg object-cover"
					src={mqBannerImage.current
						? images.value.find((x) => x.id === extractId(details.mainSeason))?.bannerImage || ''
						: images.value.find((x) => x.id === extractId(details.mainSeason))?.coverImage
								.extraLarge || ''}
					alt={`Cover image for ${details.titleEnglish}`}
				/>
			{:else}
				<Suspense.Image />
			{/if}
		</a>
		<div class="flex flex-1 flex-col justify-between rounded-lg max-md:relative">
			{#if mqBannerImage.current}
				<div class="absolute h-full w-full rounded-lg bg-black opacity-50"></div>
			{/if}
			<div class="flex flex-col gap-1 p-2 max-md:z-10">
				<a
					href={`/gotgames/anime/${details.animeId}`}
					class="max-md:text-primary-50 text-primary-900 dark:text-primary-50 hover:text-accent-400 text-xl font-bold transition-all duration-150"
				>
					{details.titleEnglish ?? details.titleRomaji ?? details.titleNative ?? ''}
				</a>
				<div class="max-md:text-primary-400 text-primary-600 dark:text-primary-400 text-xs">
					{details.titleNative}
				</div>
				<div class="max-md:text-primary-50 text-primary-900 dark:text-primary-50">
					{details.genres.join(', ')}
				</div>
				<div class="max-md:text-primary-50 text-primary-900 dark:text-primary-50">
					Watched: {details.totalEpisodesWatched}/{details.totalEpisodes}
				</div>
			</div>
			<div class="flex gap-2 p-2 max-md:z-10">
				<Button
					variant="warning"
					shape="rounded"
					filled
					fullWidth
					onclick={() => {
						modalData = details;
						modalOpen = true;
					}}
				>
					<span class="font-bold">Watch</span>
				</Button>
				<LinkButton
					variant="warning"
					shape="rounded"
					filled
					fullWidth
					href={details.mainSeason}
					target="_blank"
				>
					<span class="font-bold">AniList</span>
				</LinkButton>
			</div>
		</div>
	</div>
{/snippet}

{#snippet cardLess(details: AnimeCard)}
	<div class="dark:bg-primary-700 bg-primary-200 relative flex h-50 rounded-xl">
		<div class="flex h-full items-center">
			{#if images.value.find((x) => x.id)}
				<img
					class="absolute top-0 left-0 block h-full w-full rounded-lg object-cover"
					src={images.value.find((x) => x.id === extractId(details.mainSeason))?.bannerImage || ''}
					alt={`Cover image for ${details.titleEnglish}`}
				/>
			{:else}
				<Suspense.Image />
			{/if}
		</div>
		<div class="relative flex flex-1 flex-col items-center justify-between rounded-lg">
			<div class="absolute h-full w-full rounded-lg bg-black opacity-75"></div>
			<div class="z-10 flex flex-col items-center justify-center gap-1 p-2 text-center">
				<a
					href={`/anime/${details.animeId}`}
					class="text-primary-50 dark:text-primary-50 hover:text-accent-400 text-xl font-bold transition-all duration-150"
				>
					{details.titleEnglish ?? details.titleRomaji ?? details.titleNative}
				</a>
				<div class="text-primary-400 text-xs">
					{details.titleNative}
				</div>
			</div>
			<div class="z-10 flex w-full gap-2 p-2">
				<Button
					variant="warning"
					shape="rounded"
					filled
					fullWidth
					onclick={() => {
						modalData = details;
						modalOpen = true;
					}}
				>
					<span class="font-bold">Watch</span>
				</Button>
				<LinkButton
					variant="warning"
					shape="rounded"
					filled
					fullWidth
					href={details.mainSeason}
					target="_blank"
				>
					<span class="font-bold">AniList</span>
				</LinkButton>
			</div>
		</div>
	</div>
{/snippet}

<div class="flex flex-col justify-center gap-2">
	<div class="grid grid-cols-[1fr_auto] gap-2">
		<Input bind:value={searchInput} id="search" placeholder="Search..." rounded="lg">
			<span class="p-1"><Search /></span>
		</Input>
		{#if displayType === 'more'}
			<Button shape="rounded" filled onclick={() => (displayType = 'less')}>
				<Grid3x3 />
			</Button>
		{:else}
			<Button shape="rounded" filled onclick={() => (displayType = 'more')}>
				<Grid2x2 />
			</Button>
		{/if}
	</div>
	<div
		class={[
			'grid gap-2',
			displayType === 'more' && 'grid-cols-1 lg:grid-cols-2',
			displayType === 'less' && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4'
		]}
	>
		{#each _.take(filterAnime(data.anime), displayAmount) as a}
			{#if displayType === 'more'}
				{@render card(a)}
			{:else if displayType === 'less'}
				{@render cardLess(a)}
			{/if}
		{/each}
	</div>
	<Button
		variant="warning"
		fullWidth
		filled
		shape="rounded"
		onclick={() => {
			if (displayAmount < data.anime.length) {
				displayAmount += 16;
			} else {
				toast.info('No more anime to show!');
			}
		}}
	>
		<span class="font-bold">Show more</span>
	</Button>
	<Modal open={modalOpen} onclose={() => (modalOpen = false)} appendClass="max-md:w-3/4 min-h-0!">
		{#if modalData}
			<div class="flex w-full flex-col items-center justify-center gap-2">
				{#each modalData.links.filter((x) => x[0] != 'NULL') as link}
					<LinkButton
						href={link[0]}
						variant="warning"
						target="_blank"
						shape="rounded"
						appendClass="gap-2"
						filled
						fullWidth
					>
						<ListVideo />
						<span class="flex flex-col items-center justify-center gap-1">
							<p class="font-bold">
								{link[0].includes('youtube') ? 'YouTube' : 'Patreon'}
							</p>
							{#if link[1]}
								<p class="text-center text-xs">{link[1]}</p>
							{/if}
						</span>
					</LinkButton>
				{/each}
			</div>
		{/if}
	</Modal>
</div>
