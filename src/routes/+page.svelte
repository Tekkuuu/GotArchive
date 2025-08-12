<script lang="ts">
	import type { PageProps } from './$types';
	import type { WatchingWeek } from '$lib/hooks';
	import _ from 'lodash';
	import { getAnimeImagesStore, updateAnimeImagesStore } from '$lib/stores/';
	import { extractId } from '$lib/anilist/';
	import * as Suspense from '$lib/components/ui/suspense';
	import { fly } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { LinkButton } from '$lib/components/forms';
	import { HttpError } from '$lib/components/ui/';
	import { Calendar, Heart, Logs, TvMinimalPlay } from 'lucide-svelte';
	import { format, getISOWeek } from 'date-fns';
	import type { ApiErrorResponse } from '$lib/api';
	import { toast } from '$lib/components/ui/toaster';

	let { data }: PageProps = $props();
	let images = getAnimeImagesStore();

	let watching: WatchingWeek = $state([]);

	let focus = $state(0);
	let direction = $state(1); // 1 for next, -1 for prev
	let cardEl: HTMLDivElement | null = $state(null);
	let slider: ReturnType<typeof setInterval>;

	let mediumLoaded: Record<number, boolean> = $state({});
	let extraLargeLoaded: Record<number, boolean> = $state({});

	function handleMediumLoad(id: number) {
		mediumLoaded = { ...mediumLoaded, [id]: true };
	}

	function handleExtraLargeLoad(id: number) {
		extraLargeLoaded = { ...extraLargeLoaded, [id]: true };
	}

	function startSlider() {
		clearInterval(slider);
		slider = setInterval(() => {
			direction = 1;
			focus = (focus + 1) % watching.length;
			startSlider();
		}, 5000);
	}

	onMount(() => {
		let getWatching = async () => {
			let date = new Date();
			let year = date.getFullYear();
			let week = getISOWeek(date);

			const response = await fetch(
				`/api/watching/${year}${week < 10 ? '0' + week.toString() : week}`
			);

			if (response.ok) {
				watching = await response.json();
			} else {
				try {
					const errorPayload: ApiErrorResponse = await response.json();
					toast.error(
						`${errorPayload.error.message}, Error ID: ${errorPayload.error.sentryErrorId || 'N/A'}`
					);
					console.error(`Error ID: ${errorPayload.error.sentryErrorId || 'N/A'}`);
				} catch (err) {
					toast.error('An unexptected error has occured');
				}
			}

			const urls = watching.map((w) => w.anilistLink);
			await updateAnimeImagesStore(urls);
		};

		getWatching();
		startSlider();

		return () => {
			clearInterval(slider);
		};
	});
</script>

<svelte:head>
	<title>Home | G.O.T Archive</title>
	<meta
		name="description"
		content="Welcome to the G.O.T Archive, your go-to place for G.O.T's anime watching stats and schedules."
	/>
</svelte:head>

{#snippet card(entry: WatchingWeek[number])}
	{@const anilistId = extractId(entry.anilistLink)}
	{@const srcMedium = images.value.find((i) => i.id === anilistId)?.coverImage.medium}
	{@const srcExtraLarge = images.value.find((i) => i.id === anilistId)?.coverImage.extraLarge}
	<div
		class="text-primary-50 relative flex w-68 flex-col items-center justify-center rounded-xl bg-transparent p-4"
	>
		{#key anilistId}
			{#if srcMedium}
				<img
					loading="lazy"
					onload={() => handleMediumLoad(anilistId || 0)}
					src={srcMedium}
					alt={entry.titles.english ?? entry.titles.romaji ?? entry.titles.native}
					class="block aspect-[3/4] w-68 rounded-lg object-cover {extraLargeLoaded[anilistId || 0]
						? 'hidden'
						: ''}"
				/>
				<img
					loading="lazy"
					onload={() => handleExtraLargeLoad(anilistId || 0)}
					src={srcExtraLarge}
					alt={entry.titles.english ?? entry.titles.romaji ?? entry.titles.native}
					class="block aspect-[3/4] w-68 rounded-lg object-cover {extraLargeLoaded[anilistId || 0]
						? 'opacity-100'
						: 'absolute opacity-0'}"
				/>
			{:else}
				<div class="block aspect-[3/4] h-88 w-68 rounded-lg object-cover">
					<Suspense.Image />
				</div>
			{/if}
		{/key}
		<div
			class="absolute bottom-4 left-1/2 z-20 flex w-60 -translate-x-1/2 flex-col items-center rounded-b-lg bg-black/75 p-4"
		>
			<a
				href="/gotgames/anime/{entry.animeId}"
				class="text-center font-bold transition-all duration-150 hover:text-amber-400"
				>{entry.titles.english ?? entry.titles.romaji ?? entry.titles.native}</a
			>
			<span>Episodes</span>
			<span>{entry.episodes.join(', ')}</span>
		</div>
	</div>
{/snippet}

{#snippet statistic(title: string, stat: string | number)}
	<div
		class="text-primary-900 dark:text-primary-50 border-primary-600 w-full rounded-lg border p-2"
	>
		{title}: <span class="font-bold">{stat}</span>
	</div>
{/snippet}

<div class="container mx-auto px-4 py-8 lg:px-8">
	<!-- Watching -->
	<section class="mb-12 flex flex-col items-center justify-center">
		<h2 class="mb-6 text-3xl font-bold dark:text-white">Watching this week</h2>
		{#if watching.length >= 3}
			<div class="relative w-full overflow-hidden" style="height: {cardEl?.offsetHeight || 352}px">
				{#key focus}
					{@const next = (focus + 1) % watching.length}
					{@const prev = (focus - 1 + watching.length) % watching.length}
					<div
						class="absolute left-1/2 -translate-x-1/2 max-lg:hidden"
						style="transform: translateX(-{cardEl?.offsetWidth}px);"
						in:fly={{ x: (cardEl?.offsetWidth || 280) * direction, duration: 1000 }}
						out:fly={{ x: -(cardEl?.offsetWidth || 280) * direction, duration: 1000 }}
					>
						{@render card(watching[prev])}
					</div>
					<div
						class="absolute left-1/2 -translate-x-1/2"
						in:fly={{ x: (cardEl?.offsetWidth || 280) * direction, duration: 1000 }}
						out:fly={{ x: -(cardEl?.offsetWidth || 280) * direction, duration: 1000 }}
						bind:this={cardEl}
					>
						{@render card(watching[focus])}
					</div>
					<div
						class="absolute left-1/2 -translate-x-1/2 max-lg:hidden"
						style="transform: translateX({cardEl?.offsetWidth}px);"
						in:fly={{ x: (cardEl?.offsetWidth || 280) * direction, duration: 1000 }}
						out:fly={{ x: -(cardEl?.offsetWidth || 280) * direction, duration: 1000 }}
					>
						{@render card(watching[next])}
					</div>
				{/key}
			</div>
		{:else}
			<div class="flex w-full items-center justify-center max-sm:flex-col">
				{#each watching as entry}
					{@render card(entry)}
				{/each}
			</div>
		{/if}
		{#if watching.length >= 3}
			<div
				class="dark:border-primary-700 border-primary-400 mt-4 flex justify-center space-x-2 rounded-full border p-2"
			>
				{#if watching.length === 0}
					<span class="block h-4 w-4"></span>
				{:else}
					{#each watching as w, i}
						<button
							class={[
								'h-4 w-4 cursor-pointer rounded-full transition-all duration-150',
								'hover:bg-amber-400',
								i === focus ? 'bg-amber-400' : 'dark:bg-primary-700 bg-primary-400'
							]}
							onclick={() => {
								if (i > focus) {
									direction = 1;
								} else {
									direction = -1;
								}
								focus = i;
								startSlider();
							}}
							aria-label="Select {w.titles.english ?? w.titles.romaji ?? w.titles.native} anime"
						>
						</button>
					{/each}
				{/if}
			</div>
		{/if}
	</section>

	<!-- Archive Stats -->
	<section class="mb-4 flex flex-col items-center justify-center">
		<h2 class="text-primary-900 dark:text-primary-50 mb-4 text-2xl font-semibold">Archive stats</h2>
		{#if !data.error}
			<div class="grid w-full gap-4 sm:grid-cols-1 lg:grid-cols-2">
				{@render statistic('Total anime', data.totalAnime)}
				{@render statistic('Total episodes watched', data.totalEpisodesWatched)}
			</div>
		{:else}
			<HttpError error={data.error} />
		{/if}
	</section>

	<!-- Useful Links -->
	<section class="mb-4 flex flex-col items-center justify-center">
		<h2 class="text-primary-900 dark:text-primary-50 mb-4 text-2xl font-semibold">Useful links</h2>
		<div class="grid w-full grid-cols-1 gap-4 min-md:grid-cols-2">
			<LinkButton href="/gotgames/schedule" variant="info" filled shape="rounded" fullWidth>
				<Calendar /><span class="pl-2 font-bold">Check out this week's schedule</span>
			</LinkButton>
			<LinkButton href="/gotgames/anime/list" variant="info" filled shape="rounded" fullWidth>
				<TvMinimalPlay /><span class="pl-2 font-bold">Search through anime</span>
			</LinkButton>
			<LinkButton
				href="/about"
				filled
				shape="rounded"
				variant="warning"
				fullWidth
				appendClass="md:col-span-2"
			>
				<Heart /><span class="pl-2 font-bold">Support this project</span>
			</LinkButton>
		</div>
	</section>

	<!-- Changelog -->
	<section class="mb-4 flex flex-col items-center justify-center gap-2">
		<h2 class="text-primary-900 dark:text-primary-50 mb-4 text-2xl font-semibold">Site news</h2>
		<div class="border-info flex w-full flex-col gap-2 min-md:flex-row">
			{#each _.take(_.orderBy(data.changelogs, ['createdAt'], ['desc']), 3) as c}
				<div
					class="text-primary-900 dark:text-primary-50 border-info flex w-full flex-col gap-1 rounded-lg border p-2"
				>
					<h3 class="text-center text-xl">{c.title}</h3>
					<h4 class="dark:text-primary-300 text-primary-700 text-center">
						{c.author} · {format(c.createdAt, 'yyyy-MM-dd, HH:mm')}
					</h4>
					<LinkButton
						href={`/changelog/${c.changelogId}`}
						variant="info"
						shape="rounded"
						fullWidth
						filled
					>
						<Logs /><span class="font-bold">Read more</span>
					</LinkButton>
				</div>
			{/each}
		</div>
	</section>
</div>
