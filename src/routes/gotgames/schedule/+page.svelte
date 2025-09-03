<script lang="ts">
	import type { PageProps } from './$types';
	import type { Schedule } from '$lib/hooks';
	import {
		setISOWeek,
		setISOWeekYear,
		addWeeks,
		getISOWeek,
		getISOWeekYear,
		getYear,
		startOfISOWeek,
		endOfISOWeek
	} from 'date-fns';
	import { enGB } from 'date-fns/locale/en-GB';
	import { formatInTimeZone } from 'date-fns-tz';
	import { onMount } from 'svelte';
	import _ from 'lodash';
	import { format } from 'date-fns';
	import {
		groupScheduleByWeek,
		type GroupedWeekday,
		type GroupedAnimeEntryGroup,
		type GroupedMiscEntryGroup
	} from '$lib/util/';
	import { ChevronLeft, ChevronRight, Link2 } from 'lucide-svelte';
	import { toast } from '$lib/components/ui/toaster';
	import type { ApiErrorResponse } from '$lib/api';

	let { data }: PageProps = $props();
	let { platforms } = data;

	let schedules: Array<Schedule> = $state([]);
	let scheduleDate: { year: number; week: number } = $state({
		year: getYear(new Date()),
		week: getISOWeek(new Date())
	});

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
	<div class="flex flex-col">
		<div class="divider my-2! text-lg font-bold">
			{#if entryGroup.time}
				{_.startCase(entryGroup.type)}
				{formatInTimeZone(
					new Date(`${entryGroup.date}T${entryGroup.time}Z`),
					Intl.DateTimeFormat().resolvedOptions().timeZone,
					'(HH:mm zzz)',
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
			{:else}
				{_.capitalize(entryGroup.type)} (Time TBA)
			{/if}
		</div>
		{#if entryGroup.type === 'anime'}
			{#each Object.entries(_.groupBy(entryGroup.entries, 'animeId')) as [animeId, entries]}
				<div class="flex flex-col gap-1 p-1 lg:flex-row">
					<div class="flex flex-col justify-center gap-2 text-xl font-bold">
						{#each entries as e}
							<div class="max-lg:mb-1 max-lg:flex max-lg:flex-col">
								<a href={`/gotgames/anime/${animeId}`} class="link link-hover">
									{e.titleEnglish || e.titleRomaji || e.titleNative}
								</a>
								<span class="text-base-content/50">
									<span class="lg:hidden">Episodes: </span>
									({e.episodes.join(', ')})
								</span>
							</div>
						{/each}
					</div>
					<div class="flex items-center justify-center gap-1 lg:ml-auto lg:flex-row">
						{#each _.sortBy(entries[0].platformIds) as platformId}
							{@const platform = platforms.find((p) => p.platformId === platformId)}
							<a href={platform?.url || '#'} class="btn btn-primary w-40" target="_blank">
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
							</a>
						{/each}
					</div>
				</div>
			{/each}
		{:else if entryGroup.type === 'misc'}
			{#each entryGroup.entries as entry}
				<div class="flex flex-col gap-1 lg:flex-row">
					<div class="text-xl font-bold max-lg:mb-1 max-lg:flex max-lg:flex-col">
						{entry.title}
						<span class="text-base-content/50">({entry.description})</span>
					</div>
					<div class="flex items-center justify-center gap-1 lg:ml-auto lg:flex-row">
						{#each entry.platformIds as platformId}
							{@const platform = platforms.find((p) => p.platformId === platformId)}
							<a href={platform?.url || '#'} class="btn btn-primary w-40" target="_blank">
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
							</a>
						{/each}
					</div>
				</div>
			{/each}
		{/if}
	</div>
{/snippet}

{#snippet weekday(weekday: GroupedWeekday)}
	<div class="rounded-box max-lg:flex max-lg:flex-col max-lg:gap-1 lg:grid lg:grid-cols-[1fr_9fr]">
		<div
			class="bg-primary max-lg:rounded-box lg:rounded-l-box text-primary-content flex items-center justify-center p-2 text-2xl font-bold"
		>
			{format(new Date(weekday.date), 'eee')}
		</div>
		<div class="bg-base-300 rounded-r-box p-2">
			{#each weekday.entries as entryGroup}
				{@render card(entryGroup)}
			{/each}
		</div>
	</div>
{/snippet}

<div class="flex flex-col gap-1">
	<div class="grid grid-cols-3 items-center justify-center gap-1 max-xl:grid-cols-2">
		<button
			class="btn btn-info max-xl:order-2"
			onclick={(e) => {
				updateSchedule(-1);
				e.preventDefault();
			}}
		>
			<ChevronLeft />
		</button>
		<span class="p-2 text-center text-3xl font-black max-xl:order-1 max-xl:col-span-2">
			{formatWeekRange(scheduleDate.year, scheduleDate.week)}
		</span>
		<button
			class="btn btn-info max-xl:order-2"
			onclick={(e) => {
				updateSchedule(1);
				e.preventDefault();
			}}
		>
			<ChevronRight />
		</button>
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
