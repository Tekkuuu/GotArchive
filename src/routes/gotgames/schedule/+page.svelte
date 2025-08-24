<script lang="ts">
	import type { PageProps } from './$types';
	import { MediaQuery } from 'svelte/reactivity';
	import type { Schedule } from '$lib/hooks';
	import { slide } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import {
		setISOWeek,
		setISOWeekYear,
		addWeeks,
		getISOWeek,
		getISOWeekYear,
		getYear,
		startOfISOWeek,
		endOfISOWeek,
		getISODay
	} from 'date-fns';
	import { enGB } from 'date-fns/locale/en-GB';
	import { formatInTimeZone } from 'date-fns-tz';
	import { onMount } from 'svelte';
	import _ from 'lodash';
	import { format } from 'date-fns';
	import {
		groupScheduleByWeek,
		type GroupedScheduleWeek,
		type GroupedWeekday,
		type GroupedAnimeEntryGroup,
		type GroupedMiscEntryGroup
	} from '$lib/util/';
	import { Button, LinkButton } from '$lib/components/forms/';
	import { ChevronDown, ChevronLeft, ChevronRight, Link2 } from 'lucide-svelte';
	import { toast } from '$lib/components/ui/toaster';
	import type { ApiErrorResponse } from '$lib/api';

	let { data }: PageProps = $props();
	let { platforms } = data;

	const maxSmallMq = new MediaQuery('max-width: 39.999rem'); // 640px

	let schedules: Array<Schedule> = $state([]);
	let scheduleDate: { year: number; week: number } = $state({
		year: getYear(new Date()),
		week: getISOWeek(new Date())
	});
	let collapseDay: Array<boolean> = $state([false, false, false, false, false, false, false]);

	async function updateSchedule(weekOffset: number) {
		// Calculate new date based on current scheduleDate and offset
		const baseDate = setISOWeek(setISOWeekYear(new Date(0), scheduleDate.year), scheduleDate.week);
		const newDate = addWeeks(baseDate, weekOffset);
		const newYear = getISOWeekYear(newDate);
		const newWeek = getISOWeek(newDate);
		const datecode = `${newYear}${newWeek < 10 ? '0' + newWeek.toString() : newWeek}`;

		// Check cache
		let cached = schedules.find((s) => `${s.scheduleInfo.year}${s.scheduleInfo.week}` === datecode);
		if (cached) {
			scheduleDate = { year: newYear, week: newWeek };
			return;
		}

		let response = await fetch(`/api/schedule/${datecode}?preview=false`);
		if (response.ok) {
			const data: Schedule = await response.json();

			if (data.scheduleInfo.scheduleId <= 0 || data.scheduleEntries.length === 0) {
				toast.info('No schedule found for this week.');
			}

			scheduleDate = { year: data.scheduleInfo.year, week: data.scheduleInfo.week };
			schedules = [...schedules, data];
		} else if (response.status === 404) {
			toast.info('No schedule found for this week.');
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
	}

	function formatWeekRange(year: number, week: number) {
		const start = startOfISOWeek(setISOWeek(setISOWeekYear(new Date(0), year), week));
		const end = endOfISOWeek(start);

		const startDay = start.getDate();
		const startMonth = format(start, 'LLL');
		const startYear = start.getFullYear();

		const endDay = end.getDate();
		const endMonth = format(end, 'LLL');
		const endYear = end.getFullYear();

		if (startYear === endYear && startMonth === endMonth) {
			return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
		} else if (startYear === endYear) {
			return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
		} else {
			return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
		}
	}

	onMount(async () => {
		await updateSchedule(0);
	});
</script>

<svelte:head>
	<title>
		Schedule {formatWeekRange(scheduleDate.year, scheduleDate.week)} | G.O.T Archive
	</title>
</svelte:head>

{#snippet card(entryGroup: GroupedAnimeEntryGroup | GroupedMiscEntryGroup)}
	<div class="flex flex-col rounded-lg">
		<div
			class="
        bg-primary-300 dark:bg-primary-800
        text-primary-900 dark:text-primary-50
        border-accent-400
        border p-2 text-center
        text-xl font-bold
      "
		>
			{#if entryGroup.time}
				{_.capitalize(entryGroup.type)} —
				{formatInTimeZone(new Date(`${entryGroup.date}T${entryGroup.time}Z`), 'UTC', 'HH:mm')} UTC (
				{formatInTimeZone(
					new Date(`${entryGroup.date}T${entryGroup.time}Z`),
					Intl.DateTimeFormat().resolvedOptions().timeZone,
					'HH:mm zzz',
					{ locale: enGB }
				)}
				{#if formatInTimeZone(new Date(`${entryGroup.date}T${entryGroup.time}Z`), 'UTC', 'yyyy-MM-dd') !== formatInTimeZone(new Date(`${entryGroup.date}T${entryGroup.time}Z`), Intl.DateTimeFormat().resolvedOptions().timeZone, 'yyyy-MM-dd')}
					{formatInTimeZone(
						new Date(`${entryGroup.date}T${entryGroup.time}Z`),
						Intl.DateTimeFormat().resolvedOptions().timeZone,
						'eee, d MMM zzz',
						{ locale: enGB }
					)}
				{/if}
				)
			{:else}
				{_.capitalize(entryGroup.type)} ( Time TBA )
			{/if}
		</div>
		{#if entryGroup.type === 'anime'}
			{#each Object.entries(_.groupBy(entryGroup.entries, 'animeId')) as [animeId, entries]}
				<div class="flex flex-col gap-1 p-1 min-md:grid min-md:grid-cols-[7fr_3fr]">
					<div class="text-primary-900 dark:text-primary-50 flex flex-col gap-1">
						{#each entries as e}
							<a
								href={`/gotgames/anime/${animeId}`}
								class="hover:text-warning text-xl font-bold transition-all duration-150"
							>
								{e.titleEnglish || e.titleRomaji || e.titleNative}
							</a>
							<span>Episode{e.episodes.length > 1 ? 's' : ''}: {e.episodes.join(', ')}</span>
						{/each}
					</div>
					<div class="flex items-center justify-center gap-1">
						{#each entries[0].platformIds as platformId}
							{@const platform = platforms.find((p) => p.platformId === platformId)}
							<LinkButton
								href={platform?.url || '#'}
								variant="warning"
								shape="rounded"
								filled
								fullWidth
								appendClass="flex gap-1 justify-center items-center mb-1"
							>
								<Link2 />
								<span class="font-bold">
									{#if platform?.url.includes('youtube')}
										YouTube
									{:else if platform?.url.includes('twitch')}
										Twitch
									{:else if platform?.url.includes('patreon')}
										Patreon
									{/if}
								</span>
							</LinkButton>
						{/each}
					</div>
				</div>
				<!-- <div -->
				<!-- 	class="text-primary-900 dark:text-primary-50 flex flex-col gap-1 p-1 font-medium min-md:grid min-md:grid-cols-10 min-md:grid-rows-2" -->
				<!-- > -->
				<!-- 	<span class="order-1 text-xl font-bold min-md:col-span-7"> -->
				<!-- 		<a -->
				<!-- 			href={`/gotgames/anime/${entry.animeId}`} -->
				<!-- 			class="hover:text-warning transition-all duration-150" -->
				<!-- 		> -->
				<!-- 			{entry.titleEnglish ?? entry.titleRomaji ?? entry.titleNative} -->
				<!-- 		</a> -->
				<!-- 	</span> -->
				<!-- 	<span -->
				<!-- 		class="order-3 flex items-center justify-end gap-1 min-md:order-2 min-md:col-span-3 min-md:row-span-2" -->
				<!-- 	> -->
				<!-- 		{#each entry.platformIds as platformId} -->
				<!-- 			{@const platform = platforms.find((p) => p.platformId === platformId)} -->
				<!-- 			<LinkButton -->
				<!-- 				href={platform?.url || '#'} -->
				<!-- 				variant="warning" -->
				<!-- 				shape="rounded" -->
				<!-- 				filled -->
				<!-- 				fullWidth -->
				<!-- 				appendClass="flex gap-1 justify-center items-center" -->
				<!-- 			> -->
				<!-- 				<Link2 /> -->
				<!-- 				<span class="font-bold"> -->
				<!-- 					{#if platform?.url.includes('youtube')} -->
				<!-- 						YouTube -->
				<!-- 					{:else if platform?.url.includes('twitch')} -->
				<!-- 						Twitch -->
				<!-- 					{:else if platform?.url.includes('patreon')} -->
				<!-- 						Patreon -->
				<!-- 					{/if} -->
				<!-- 				</span> -->
				<!-- 			</LinkButton> -->
				<!-- 		{/each} -->
				<!-- 	</span> -->
				<!-- 	<span class="order-2 min-md:order-3 min-md:col-span-7"> -->
				<!-- 		Episode{entry.episodes.length > 1 ? 's' : ''}: {entry.episodes.join(', ')} -->
				<!-- 	</span> -->
				<!-- </div> -->
			{/each}
		{:else if entryGroup.type === 'misc'}
			{#each entryGroup.entries as entry}
				<div
					class="text-primary-900 dark:text-primary-50 flex flex-col gap-1 p-1 font-medium min-md:grid min-md:grid-cols-10 min-md:grid-rows-2"
				>
					<span class="order-1 text-xl font-bold min-md:col-span-7">
						{entry.title}
					</span>
					<span
						class="order-3 row-span-2 flex items-center justify-end gap-1 min-md:order-2 min-md:col-span-3"
					>
						{#each entry.platformIds as platformId}
							{@const platform = platforms.find((p) => p.platformId === platformId)}
							<LinkButton
								href={platform?.url || '#'}
								variant="warning"
								shape="rounded"
								filled
								fullWidth
								appendClass="flex gap-1 justify-center items-center"
							>
								<Link2 />
								<span class="font-bold">
									{#if platform?.url.includes('youtube')}
										YouTube
									{:else if platform?.url.includes('twitch')}
										Twitch
									{:else if platform?.url.includes('patreon')}
										Patreon
									{/if}
								</span>
							</LinkButton>
						{/each}
					</span>
					<span class="order-2 min-md:order-3 min-md:col-span-7">
						{entry.description}
					</span>
				</div>
			{/each}
		{/if}
	</div>
{/snippet}

{#snippet weekday(weekday: GroupedWeekday)}
	<div class="flex flex-col">
		<button
			class="bg-warning text-primary-900 relative flex flex-1 items-center justify-center p-2 text-3xl font-bold"
			onclick={() => {
				collapseDay[getISODay(new Date(weekday.date)) - 1] =
					!collapseDay[getISODay(new Date(weekday.date)) - 1];
			}}
		>
			<span>{format(new Date(weekday.date), 'eeee')}</span>
			{#if weekday.entries.length > 0}
				<div
					class={[
						'absolute top-1/2 right-0 -translate-x-1/2 -translate-y-1/2 transition-transform duration-150',
						collapseDay[getISODay(new Date(weekday.date)) - 1] ? 'rotate-0' : 'rotate-180'
					]}
				>
					<ChevronDown />
				</div>
			{/if}
		</button>
		{#if !collapseDay[getISODay(new Date(weekday.date)) - 1]}
			<div
				class="dark:bg-primary-700 bg-primary-200"
				transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}
			>
				{#each weekday.entries as entryGroup}
					{@render card(entryGroup)}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<div class="flex flex-col gap-1">
	<div
		class={[
			'text-primary-900 dark:text-primary-50 grid grid-cols-3 items-center justify-center gap-1',
			'max-xl:grid-cols-2'
		]}
	>
		<Button
			filled
			variant="info"
			fullWidth
			appendClass="h-full max-xl:order-2"
			onclick={(e) => {
				updateSchedule(-1);
				e.preventDefault();
			}}
		>
			<ChevronLeft />
		</Button>
		<span class={['p-2 text-center text-4xl font-black', 'max-xl:order-1 max-xl:col-span-2']}>
			{formatWeekRange(scheduleDate.year, scheduleDate.week)}
		</span>
		<Button
			filled
			variant="info"
			fullWidth
			appendClass="h-full max-xl:order-3"
			onclick={(e) => {
				updateSchedule(1);
				e.preventDefault();
			}}
		>
			<ChevronRight />
		</Button>
	</div>
	{#if schedules.length > 0}
		{@const s = schedules.find((x) => {
			return (
				x.scheduleInfo.year === scheduleDate.year &&
				x.scheduleInfo.week === scheduleDate.week &&
				x.scheduleInfo.scheduleId > 0
			);
		})}
		{#if s}
			{#each groupScheduleByWeek(s) as entries}
				{@render weekday(entries)}
			{/each}
		{/if}
	{/if}
</div>
