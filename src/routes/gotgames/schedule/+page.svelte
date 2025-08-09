<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import type { MultiAnimeScheduleGroup, WeekdayScheduleGroup } from './types';
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
	import { onMount } from 'svelte';
	import _ from 'lodash';
	import { format } from 'date-fns';
	import { groupScheduleEntries, groupByWeekdaysObjects, groupEntriesForDisplay } from './util';
	import { Button, LinkButton } from '$lib/components/forms/';
	import { ChevronDown, ChevronLeft, ChevronRight, Link2 } from 'lucide-svelte';
	import { toast } from '$lib/components/ui/toaster';
	import type { ApiErrorResponse } from '$lib/api';

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

		let response = await fetch(`/api/schedule/${datecode}`);
		if (response.ok) {
			const data: Schedule = await response.json();

			if (data.scheduleInfo.scheduleId <= 0) {
				toast.info('No schedule found for this week.');
			}
			scheduleDate = { year: data.scheduleInfo.year, week: data.scheduleInfo.week };
			schedules = [...schedules, data];
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

{#snippet card(entryGroup: MultiAnimeScheduleGroup)}
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
				{_.capitalize(entryGroup.type)} — {format(
					new Date(`2000-01-01T${entryGroup.time}`),
					'HH:mm'
				)}
			{:else}
				{_.capitalize(entryGroup.type)}
			{/if}
		</div>
		{#each groupEntriesForDisplay([entryGroup]) as displayBlock}
			{#if displayBlock.isMultiPlatformAnimeVariant}
				<!-- Rule 1: Single anime variant, multiple platforms -->
				<div
					class="text-primary-900 dark:text-primary-50 grid grid-cols-[1fr_auto] gap-1 p-2 max-sm:grid-cols-1"
				>
					<div>
						<a
							href={`/gotgames/anime/${displayBlock.animeId}`}
							class="dark:text-primary-50 hover:text-accent-400 text-xl font-bold transition-colors duration-150"
						>
							<span
								>{displayBlock.titleEnglish ??
									displayBlock.titleRomaji ??
									displayBlock.titleNative}</span
							>
						</a>
					</div>
					<div
						class={['row-span-2 flex justify-end gap-2', 'max-sm:order-2 max-sm:justify-center']}
					>
						{#each displayBlock.platforms ?? [] as platform}
							<LinkButton
								variant="warning"
								target="_blank"
								shape="rounded"
								filled
								href={platform.platformUrl}
								appendClass="gap-2"
								fullWidth={maxSmallMq.current}
							>
								<Link2 />
								<span class="font-bold">
									{#if platform.platformUrl.includes('youtube')}
										YouTube
									{:else if platform.platformUrl.includes('patreon')}
										Patreon
									{:else if platform.platformUrl.includes('twitch')}
										Twitch
									{/if}
								</span>
							</LinkButton>
						{/each}
					</div>
					<span class={['max-sm: order-1']}>Episodes: {displayBlock.episodes?.join(', ')}</span>
				</div>
			{:else if displayBlock.isSinglePlatformShared}
				<!-- Rule 2 & 3: Single platform, multiple anime/variants -->
				<div
					class={[
						'text-primary-900 dark:text-primary-50 grid grid-cols-[1fr_auto] gap-1 p-2',
						'max-sm:grid-cols-1'
					]}
				>
					<div class="flex flex-col gap-1">
						{#each displayBlock.animeList ?? [] as anime}
							<div class={['flex flex-col gap-1', 'max-sm:flex-col']}>
								<a
									href={`/gotgames/anime/${anime.animeId}`}
									class="dark:text-primary-50 hover:text-accent-400 text-xl font-bold transition-colors duration-150"
								>
									<span>{anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative}</span>
								</a>
								<span>Episodes: {anime.episodes.join(', ')}</span>
							</div>
						{/each}
					</div>
					<div
						class={[
							'flex flex-col justify-center *:h-full',
							'max-sm:flex-row max-sm:justify-center'
						]}
					>
						<LinkButton
							variant="warning"
							target="_blank"
							shape="rounded"
							filled
							href={displayBlock.platformUrl}
							appendClass="gap-2"
							fullWidth={maxSmallMq.current}
						>
							<Link2 />
							<span class="font-bold">
								{#if displayBlock.platformUrl?.includes('youtube')}
									YouTube
								{:else if displayBlock.platformUrl?.includes('patreon')}
									Patreon
								{:else if displayBlock.platformUrl?.includes('twitch')}
									Twitch
								{/if}
							</span>
						</LinkButton>
					</div>
				</div>
			{/if}
		{/each}
	</div>
{/snippet}

{#snippet weekday(weekday: WeekdayScheduleGroup)}
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
		})?.scheduleEntries}
		{#if s}
			{#each groupByWeekdaysObjects(groupScheduleEntries(s)) as entries}
				{@render weekday(entries)}
			{/each}
		{/if}
	{/if}
</div>
