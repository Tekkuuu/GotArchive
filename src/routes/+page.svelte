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
	<a
		href="/gotgames/anime/{entry.animeId}"
		class="card bg-base-100 m-4 w-68 shadow-sm transition-all duration-150 hover:scale-[102%]"
	>
		{#key anilistId}
			{#if srcMedium}
				<figure>
					<img
						loading="lazy"
						onload={() => handleMediumLoad(anilistId || 0)}
						src={srcMedium}
						alt={entry.titles.english ?? entry.titles.romaji ?? entry.titles.native}
						class="block aspect-[3/4] w-68 object-cover {extraLargeLoaded[anilistId || 0]
							? 'hidden'
							: ''}"
					/>
					<img
						loading="lazy"
						onload={() => handleExtraLargeLoad(anilistId || 0)}
						src={srcExtraLarge}
						alt={entry.titles.english ?? entry.titles.romaji ?? entry.titles.native}
						class="block aspect-[3/4] w-68 object-cover {extraLargeLoaded[anilistId || 0]
							? 'opacity-100'
							: 'absolute opacity-0'}"
					/>
				</figure>
			{:else}
				<div class="block aspect-[3/4] h-88 w-68 rounded-lg object-cover">
					<Suspense.Image />
				</div>
			{/if}
		{/key}
		<div class="card-body h-40 items-center text-center">
			<div class="card-title">
				{entry.titles.english ?? entry.titles.romaji ?? entry.titles.native}
			</div>
			<p>
				Episodes:
				<br />
				{entry.episodes.join(', ')}
			</p>
		</div>
	</a>
{/snippet}

{#snippet statistic(title: string, stat: string | number, desc: string)}
	<div class="stat">
		<div class="stat-title">{title}</div>
		<div class="stat-value">{stat}</div>
		<div class="stat-desc">{desc}</div>
	</div>
{/snippet}

<div class="container mx-auto">
	<div class="divider text-3xl font-bold">Watching this week</div>
	<!-- Watching -->
	<section class="flex flex-col items-center justify-center">
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
			<div class="border-neutral flex gap-2 rounded-full border p-2">
				{#each watching as w, i}
					<button
						class="join-item btn btn-circle btn-xs btn-neutral {i === focus && 'btn-primary'}"
						aria-label="carousel-{i}"
						onclick={() => {
							if (i > focus) {
								direction = 1;
							} else {
								direction = -1;
							}
							focus = i;
							startSlider();
						}}
					></button>
				{/each}
			</div>
		{/if}
	</section>

	<div class="divider text-2xl font-bold">Archive stats</div>

	<!-- Archive Stats -->
	<section class="flex flex-col items-center justify-center">
		{#if !data.error}
			<div class="stats bg-base-100 shadow">
				{@render statistic('Total anime', data.totalAnime, '')}
				{@render statistic('Total episodes watched', data.totalEpisodesWatched, '')}
			</div>
		{:else}
			<HttpError error={data.error} />
		{/if}
	</section>

	<div class="divider text-2xl font-bold">Useful links</div>

	<!-- Useful Links -->
	<section class="flex flex-col items-center justify-center">
		<div class="grid w-full grid-cols-1 gap-4 min-md:grid-cols-2">
			<a href="/gotgames/schedule" class="btn btn-info">
				<Calendar /><span class="pl-2 font-bold">Check out this week's schedule</span>
			</a>
			<a href="/gotgames/anime/list" class="btn btn-info">
				<TvMinimalPlay /><span class="pl-2 font-bold">Search through anime</span>
			</a>
			<a href="/about" class="btn btn-primary md:col-span-2">
				<Heart /><span class="pl-2 font-bold">Support this project</span>
			</a>
		</div>
	</section>

	<div class="divider text-2xl font-bold">Site news</div>

	<!-- Changelog -->
	<section class="flex flex-col items-center justify-center gap-2">
		<div class="flex w-full flex-col gap-2 min-md:flex-row">
			{#each _.take(_.orderBy(data.changelogs, ['createdAt'], ['desc']), 3) as c}
				<div
					class="border-neutral bg-base-300 flex w-full flex-col items-center justify-center gap-2 rounded-lg border p-2"
				>
					<h3 class="text-center text-xl font-semibold">{c.title}</h3>
					<div class="badge badge-neutral">
						{c.author} · {format(c.createdAt, 'yyyy-MM-dd, HH:mm')}
					</div>
					<a href={`/changelog/${c.changelogId}`} class="btn btn-info w-full">
						<Logs /><span class="font-bold">Read more</span>
					</a>
				</div>
			{/each}
		</div>
	</section>
</div>
