<script lang="ts">
	import type { PageProps } from './$types';
	import type { ScheduleEntryData } from '$lib/api/schedule/datecode';
	import { page } from '$app/state';
	import { updateAnimeImagesStore, resolveTimeZone } from '$lib/stores/';
	import { onMount } from 'svelte';
	import { format, parseISO } from 'date-fns';
	import { Calendar, Clock, Heart, TvMinimalPlay } from 'lucide-svelte';
	import { notification } from '$lib/components/ui/toaster';
	import { WatchingCarousel } from '$lib/components/ui/carousel';
	import { applyTimezone, tzAbbreviation } from '$lib/api/schedule/datecode';
	import { formatTime } from '$lib/util/scheduleEntry';

	let { data }: PageProps = $props();

	let watching = $derived(data.watching);

	const tzParam = $derived(page.url.searchParams.get('tz'));
	const timeZone = $derived(resolveTimeZone(tzParam));

	/**
	 * Display title for an up-next row.
	 * @param entry - Schedule entry.
	 * @returns Title.
	 */
	function upcomingTitle(entry: ScheduleEntryData): string {
		if (entry.title) return entry.title;
		const season = entry.animeSeasons[0];
		if (!season) return 'Untitled';
		return (
			season.shortTitle ||
			season.titleEnglish ||
			season.titleRomaji ||
			season.titleNative ||
			season.anime.shortTitle ||
			season.anime.titleEnglish ||
			season.anime.titleRomaji ||
			season.anime.titleNative ||
			'Untitled'
		);
	}

	const upcoming = $derived(
		data.upcoming.map((entry) => {
			const adjusted = applyTimezone(entry, timeZone);
			const at = new Date(`${adjusted.date}T12:00:00Z`);
			return {
				scheduleEntryId: entry.scheduleEntryId,
				weekday: format(parseISO(adjusted.date), 'EEE'),
				time: formatTime(adjusted.adjustedTime ?? adjusted.time),
				code: tzAbbreviation(timeZone, at) ?? timeZone,
				title: upcomingTitle(entry),
				type: entry.type
			};
		})
	);

	onMount(() => {
		for (const err of data.errors) {
			notification.error(err, 5000);
		}

		async function fetchImages() {
			const anilistIds = watching
				.filter((w) => w.anilistId !== null)
				.map((w) => w.anilistId as number);
			await updateAnimeImagesStore(anilistIds);
		}

		fetchImages();
	});
</script>

<svelte:head>
	<title>Home | G.O.T Archive</title>
	<meta
		name="description"
		content="Welcome to the G.O.T Archive, your go-to place for G.O.T's anime watching stats and schedules."
	/>
</svelte:head>

<div class="container mx-auto">
	<!-- Hero -->
	<section
		class="relative grid grid-cols-1 items-center justify-center gap-4 overflow-hidden p-2 text-center lg:grid-cols-[1fr_auto_1fr]"
	>
		<span
			aria-hidden="true"
			class="text-base-content/15 hidden shrink-0 text-right leading-none font-black tracking-tighter whitespace-nowrap select-none max-lg:hidden lg:block lg:text-[7vw]"
		>
			{data.weekStartLabel.split(' ').reverse().join(' ')}
		</span>
		<div class=" relative flex shrink-0 flex-col items-center gap-2">
			<h1
				class="text-4xl font-extrabold tracking-tight text-white mix-blend-difference md:text-5xl"
			>
				G.O.T Archive
			</h1>
			<p class="text-base-content/60 text-sm md:text-base lg:hidden">{data.weekDates}</p>
			<div class="grid grid-cols-2 gap-2">
				<a href="/gotgames/schedule" class="btn btn-neutral">
					<Calendar class="size-5" />
					<span class="font-bold">Schedule</span>
				</a>
				<a href="/gotgames/anime/list" class="btn btn-neutral">
					<TvMinimalPlay class="size-5" />
					<span class="font-bold">Anime</span>
				</a>
			</div>
		</div>
		<span
			aria-hidden="true"
			class="text-base-content/15 hidden shrink-0 text-left leading-none font-black tracking-tighter whitespace-nowrap select-none max-lg:hidden lg:block lg:text-[7vw]"
		>
			{data.weekEndLabel}
		</span>
	</section>

	<!-- Socials render from the root layout -->

	<div class="divider text-3xl font-bold">Watching this week</div>
	<!-- Watching -->
	<section class="flex flex-col items-center justify-center">
		<WatchingCarousel {watching} />
	</section>

	{#if upcoming.length > 0}
		<div class="divider text-2xl font-bold">Up next</div>

		<!-- Up next -->
		<section class="flex flex-col items-center justify-center gap-2">
			<ul class="list bg-base-200 rounded-box w-full max-w-2xl shadow-md">
				{#each upcoming as entry (entry.scheduleEntryId)}
					<li class="list-row items-center gap-3">
						<div class="flex w-24 flex-col items-start">
							<span class="text-primary text-sm font-extrabold uppercase">{entry.weekday}</span>
							<span class="text-base-content/80 flex items-center gap-1 text-sm font-bold">
								<Clock class="size-3.5" />
								{entry.time}
								<span class="text-primary">{entry.code}</span>
							</span>
						</div>
						<div class="min-w-0 flex-1">
							<div class="truncate font-medium">{entry.title}</div>
							<div class="text-base-content/50 text-xs capitalize">{entry.type}</div>
						</div>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<div class="mt-6 flex justify-center">
		<a
			href="/about"
			class="text-base-content/60 hover:text-primary inline-flex items-center gap-1.5 text-sm font-semibold transition-colors"
		>
			<Heart class="size-4" />
			Support this project
		</a>
	</div>
</div>
