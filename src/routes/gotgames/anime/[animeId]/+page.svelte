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

	const mqBannerImage = new MediaQuery('max-width: 47.999rem');

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
	<div class="dark:bg-primary-700 bg-primary-200 relative flex flex-col rounded-xl">
		<div class="flex max-h-96 items-center overflow-hidden rounded-xl md:m-2">
			{#if images.value.find((x) => x.id)}
				<img
					loading="lazy"
					class="w-full object-cover"
					src={images.value.find((x) => x.id === extractId(details.mainSeason))?.bannerImage || ''}
					alt=""
				/>
			{:else}
				<Suspense.Image />
			{/if}
		</div>
		<div class="flex flex-1 flex-col justify-between rounded-lg max-md:relative">
			<div class="flex flex-col gap-1 p-2 max-md:z-10">
				<div class="text-primary-900 dark:text-primary-50 text-xl font-bold">
					{details.titleEnglish ?? details.titleRomaji ?? details.titleNative}
				</div>
				<div class="text-primary-600 dark:text-primary-400 text-xs">
					{details.titleNative}
				</div>
				<div class="text-primary-900 dark:text-primary-50">
					{details.genres.join(', ')}
				</div>
				<div class="text-primary-900 dark:text-primary-50">
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

{#snippet seasonCard(details: (typeof seasons)[number])}
	<div
		class={[
			'dark:bg-primary-700 bg-primary-200 relative flex rounded-xl',
			seasons.length % 2 === 1 && 'md:last:col-span-2'
		]}
	>
		<div class="flex flex-shrink-0 items-center md:w-40 md:p-2">
			{#if images.value.find((x) => x.id)}
				{#key extractId(details.anilistLink)}
					{#if !extraLargeLoaded[extractId(details.anilistLink) ?? 0]}
						<img
							class="block h-56 rounded-lg object-cover min-md:blur-xs"
							loading="lazy"
							alt={`Medium cover image for ${details.titleEnglish || details.titleRomaji || details.titleNative}`}
							src={mqBannerImage.current
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
							class="block h-full w-full rounded-lg object-cover {extraLargeLoaded[
								extractId(details.anilistLink) ?? 0
							]
								? 'opacity-100'
								: 'absolute opacity-0'}"
							src={mqBannerImage.current
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
		</div>

		<div class="flex flex-1 flex-col justify-between rounded-lg max-md:relative">
			{#if mqBannerImage.current}
				<div class="absolute h-full w-full rounded-lg bg-black opacity-75"></div>
			{/if}
			<div class="flex h-full flex-col justify-between gap-1 p-2 max-md:z-10">
				<a
					href={details.anilistLink}
					target="_blank"
					class="max-md:text-primary-50 text-primary-900 dark:text-primary-50 hover:text-accent-400 text-xl font-bold transition-all duration-150"
				>
					{details.titleEnglish ?? details.titleRomaji ?? details.titleNative}
				</a>
				<div class="max-md:text-primary-400 text-primary-600 dark:text-primary-400 text-xs">
					{details.titleNative}
				</div>
				<div class="max-md:text-primary-50 text-primary-900 dark:text-primary-50">
					Released: {_.capitalize(details.season ?? 'N/A')}
					{details.year}
				</div>
				<div class="max-md:text-primary-50 text-primary-900 dark:text-primary-50">
					Format: {details.format}
				</div>
				<div class="max-md:text-primary-50 text-primary-900 dark:text-primary-50">
					Watched: {details.watchedInSeason}/{details.episodes}
				</div>
				<div class="max-md:text-primary-50 text-primary-900 dark:text-primary-50">
					Status: {details.status}
				</div>
				<div>
					<LinkButton
						variant="warning"
						shape="rounded"
						href={details.anilistLink}
						target="_blank"
						fullWidth
						filled
						appendClass="dark:*:fill-[#FFFFFF] *:fill-[#212121] max-md:*:fill-[#FFFFFF] *:h-5"
					>
						<span class="font-bold">View on AniList</span>
					</LinkButton>
				</div>
			</div>
		</div>
	</div>
{/snippet}

<div class="flex flex-col justify-center gap-1">
	{#if anime !== undefined}
		{@render animeCard(anime)}
	{/if}
	<div class={['grid grid-cols-1 gap-1', seasons.length !== 1 && 'lg:grid-cols-2']}>
		{#each seasons.sort((a, b) => a.sequence - b.sequence) as season}
			{@render seasonCard(season)}
		{/each}
	</div>
	<Modal open={modalOpen} onclose={() => (modalOpen = false)} appendClass="max-md:w-3/4 min-h-0!">
		{#if anime}
			<div class="flex w-full flex-col items-center justify-center gap-2">
				{#each anime.links.filter((x) => x[0] != 'NULL') as link}
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
