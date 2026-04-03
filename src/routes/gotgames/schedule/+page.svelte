<script lang="ts">
	import type { PageProps } from './$types';
	import type { SchedulePageData } from './types';
	import { ChevronLeft, ChevronRight, Calendar, Info, X, ImageOff, Clock } from 'lucide-svelte';
	import { addWeeks, subWeeks, getISOWeek, getISOWeekYear } from 'date-fns';
	import { onMount } from 'svelte';
	import {
		formatTime,
		getLogoUrl,
		formatAnimeSeasonDisplay,
		getPlatformDisplayName
	} from './util';
	import { WEEKDAYS } from '$lib/schemas';
	import { notification } from '$lib/components/ui/toaster';
	import { logError } from '$lib/client/logger';
	import LogoImage from '$lib/components/ui/LogoImage.svelte';
	import {
		parseTzParam,
		tzLabel as resolveTzLabel,
		groupEntriesByWeekday,
		isoWeekDateRange
	} from '$lib/api/schedule/datecode';
	import type { TimezoneAdjustedEntry } from '$lib/api/schedule/datecode';
	import { page } from '$app/state';

	let { data }: PageProps = $props();

	// Extract schedule data from page props
	let scheduleData = $derived<SchedulePageData>({
		schedule: data.schedule,
		weekRange: data.weekRange,
		weekDateRange: data.weekDateRange,
		entries: data.entries,
		adjacentEntries: data.adjacentEntries,
		currentYear: data.currentYear,
		currentWeek: data.currentWeek
	});
	let loading = $state(false);
	let errorMessage = $state<string | null>(null);

	/** UTC offset in minutes — defaults to GMT when `tz` param is absent */
	const tzOffsetMinutes = $derived(parseTzParam(page.url.searchParams.get('tz')));

	/** Display label for the active timezone, e.g. "GMT", "UTC+1" */
	const activeTzLabel = $derived(resolveTzLabel(page.url.searchParams.get('tz')));

	// Group entries by weekday, with timezone applied
	const entriesByWeekday = $derived.by((): Map<number, TimezoneAdjustedEntry[]> => {
		const allEntries = [...scheduleData.entries, ...scheduleData.adjacentEntries];
		const groups = groupEntriesByWeekday(allEntries, tzOffsetMinutes ?? 0, scheduleData.weekDateRange);

		// Sort entries within each day by (adjusted) time
		groups.forEach((entries: TimezoneAdjustedEntry[]) => {
			entries.sort((a: TimezoneAdjustedEntry, b: TimezoneAdjustedEntry) => {
				const timeA = a.time ?? '';
				const timeB = b.time ?? '';
				return timeA.localeCompare(timeB);
			});
		});

		return groups;
	});

	/**
	 * Navigate to a specific week
	 */
	async function navigateToWeek(year: number, week: number) {
		loading = true;
		errorMessage = null;

		const datecode = `${year}${week.toString().padStart(2, '0')}`;

		try {
			const response = await fetch(`/api/schedule/${datecode}`);
			const result = await response.json();

		if (result.success) {
				scheduleData = {
					...result.data,
					currentYear: year,
					currentWeek: week
				};
			} else {
				// Show error but update current week/year to allow further navigation
				scheduleData = {
					schedule: null,
					weekRange: `Week ${week}, ${year}`,
					weekDateRange: isoWeekDateRange(year, week),
					entries: [],
					adjacentEntries: [],
					currentYear: year,
					currentWeek: week
				};
				errorMessage = `No schedule found for ${year} Week ${week}`;
			}

			// Update browser history
			history.pushState({ year, week }, '', `/gotgames/schedule?year=${year}&week=${week}`);
		} catch (err) {
			logError('Error fetching schedule', { error: String(err) });
			errorMessage = 'Network error while loading schedule';
			notification.error('Network error while loading schedule');
		} finally {
			loading = false;
		}
	}

	/**
	 * Go to previous week
	 */
	function goToPrevWeek() {
		// Calculate previous week
		const currentDate = new Date(scheduleData.currentYear, 0, 1);
		currentDate.setDate(currentDate.getDate() + (scheduleData.currentWeek - 1) * 7);
		const prevDate = subWeeks(currentDate, 1);

		const prevYear = getISOWeekYear(prevDate);
		const prevWeek = getISOWeek(prevDate);

		navigateToWeek(prevYear, prevWeek);
	}

	/**
	 * Go to next week
	 */
	function goToNextWeek() {
		// Calculate next week
		const currentDate = new Date(scheduleData.currentYear, 0, 1);
		currentDate.setDate(currentDate.getDate() + (scheduleData.currentWeek - 1) * 7);
		const nextDate = addWeeks(currentDate, 1);

		const nextYear = getISOWeekYear(nextDate);
		const nextWeek = getISOWeek(nextDate);

		navigateToWeek(nextYear, nextWeek);
	}

	/**
	 * Handle browser back/forward
	 */
	onMount(() => {
		const handlePopState = (event: PopStateEvent) => {
			if (event.state?.year && event.state?.week) {
				navigateToWeek(event.state.year, event.state.week);
			}
		};

		window.addEventListener('popstate', handlePopState);

		return () => {
			window.removeEventListener('popstate', handlePopState);
		};
	});
</script>

<svelte:head>
	<title>Schedule | G.O.T Archive</title>
	<meta
		name="description"
		content="View the current week's streaming schedule on G.O.T Archive"
	/>
</svelte:head>

<div class="container mx-auto max-w-7xl p-2">
	<!-- Navigation Header -->
	<div class="mb-2 flex items-center justify-between gap-2">
		<button
			type="button"
			class="btn btn-primary btn-sm"
			onclick={goToPrevWeek}
			disabled={loading}
			aria-label="Previous week"
		>
			<ChevronLeft class="size-4" />
			<span class="hidden sm:inline">Week {scheduleData.currentWeek - 1}</span>
		</button>

		<div class="flex flex-col items-center gap-1">
			<h1 class="text-xl font-bold flex items-center gap-2">
				<Calendar class="size-5" />
				{scheduleData.weekRange}
			</h1>
			{#if activeTzLabel}
				<p class="text-xs text-base-content/50">Times shown in {activeTzLabel}</p>
			{/if}
		</div>

		<button
			type="button"
			class="btn btn-primary btn-sm"
			onclick={goToNextWeek}
			disabled={loading}
			aria-label="Next week"
		>
			<span class="hidden sm:inline">Week {scheduleData.currentWeek + 1}</span>
			<ChevronRight class="size-4" />
		</button>
	</div>

	<!-- Loading Indicator -->
	{#if loading}
		<div class="flex justify-center items-center py-2">
			<span class="loading loading-spinner loading-md"></span>
		</div>
	{/if}

	<!-- Error Message -->
	{#if errorMessage}
		<div class="alert alert-error mb-2">
			<Info class="size-5" />
			<span>{errorMessage}</span>
		</div>
	{/if}

	<!-- Schedule Entries -->
	{#if scheduleData.entries.length === 0}
		<div
			class="border border-dashed rounded-box p-2 border-base-content/20 bg-base-300/30 text-base-content/60 gap-2 flex items-center justify-center"
		>
			<Info class="size-5" />
			<span>No entries scheduled for this week</span>
		</div>
	{:else}
		<div class="space-y-2">
			{#each Array.from(entriesByWeekday.entries()).sort((a, b) => a[0] - b[0]) as [dayIndex, dayEntries]}
				<div class="card">
					<div class="card-body gap-0 p-0 group">
						<!-- Weekday Header -->
						<div
							class={[
                "bg-primary/15 group-hover:bg-primary text-base-content",
                "rounded-box rounded-b-none p-2 flex justify-between items-center",
                "transition-colors duration-150"
              ]}
						>
							<span class="font-bold text-lg">{WEEKDAYS[dayIndex].label}</span>
						</div>

						<!-- Entries List -->
						<div class="p-2 border-2 border-primary/15 rounded-b-box group-hover:border-primary transition-colors duration-150">
							{#each dayEntries as entry (entry.scheduleEntryId)}
								{@const logoUrl = getLogoUrl(entry)}
								<div class={[
                  "relative flex flex-col rounded-box items-center",
                  "bg-primary/5 group/entry hover:bg-primary/25 transition-colors duration-150 not-last:border-b-2 border-primary/15 group-hover:border-primary",
                  "rounded-none first:rounded-t-box last:rounded-b-box"
                ]}>
                  <div class="flex w-full p-2 justify-center gap-2 items-center">
                    <!-- Cancellation Overlay -->
                    {#if entry.isCancelled}
                      <div
                        class="absolute inset-0 bg-black/60 hover:bg-black/20 transition-all duration-200 rounded-box flex flex-col items-center justify-center gap-1 z-10"
                      >
                        <div class="text-error font-bold flex justify-center items-center gap-1">
                          <X />
                          <span>Cancelled</span>
                        </div>
                        {#if entry.cancelledText}
                          <span class="text-sm text-base-content/80">{entry.cancelledText}</span>
                        {/if}
                      </div>
                    {/if}

                    <!-- Logo (hidden on mobile, 240px x 48px on larger screens) -->
                    <div class="hidden sm:flex w-60 h-12 shrink-0 items-center justify-center">
                      {#if logoUrl}
                        <LogoImage
                          src={logoUrl}
                          class="w-full h-full flex items-center justify-center"
                          imgClass="max-w-full max-h-full object-contain"
                        />
                      {:else}
                        <ImageOff class="text-base-content/70"/>
                      {/if}
                    </div>

                    <div class={[
                      "hidden sm:flex",
                      "divider divider-horizontal divider-primary/25 group-hover/entry:divider-primary",
                      "transition-colors duration-150 m-0"
                    ]}></div>

                    <!-- Entry Info -->
                    <div class="w-20 flex flex-col gap-1 justify-center items-center">
                      <!-- Time and Type -->
                      <div class="flex gap-2 justify-center items-center">
                        <Clock class="size-4"/>
                        <span class="">{formatTime(entry.time)}</span>
                      </div>
                      <div class="text-primary capitalize font-bold">{entry.type}</div>
                    </div>

                    <div class={[
                      "divider divider-horizontal divider-primary/25 group-hover/entry:divider-primary",
                      "transition-colors duration-150 m-0"
                    ]}></div>

                    <!-- Title/Anime Info -->
                    {#if entry.animeSeasons && entry.animeSeasons.length > 0}
                      <div class="flex flex-col gap-0">
                        {#each entry.animeSeasons.sort((a, b) => a.sequence - b.sequence) as animeSeason}
                          <div>
                            <span>
                              {#if !entry.title}
                                {formatAnimeSeasonDisplay(animeSeason)}
                              {:else}
                                {entry.title}
                              {/if}
                            </span>
                            <span class="font-bold text-primary">
                              E{animeSeason.episodes}
                            </span>
                          </div>
                        {/each}
                      </div>
                    {:else}
                      <div class="flex flex-col gap-0">
                        <span>{entry.title || 'Untitled'}</span>
                      </div>
                    {/if}

                    <!-- Description -->
                    <div class="flex text-primary font-bold grow max-md:hidden">
                      {#if entry.description}
                        <span>{entry.description}</span>
                      {/if}
                    </div>

                    <!-- Platforms -->
                    {#if entry.platforms && entry.platforms.length > 0}
                      <div class="flex gap-1 flex-col max-md:grow max-md:items-end">
                        {#each entry.platforms as platform}
                          <a
                            href={platform.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="btn btn-xs btn-secondary btn-outline w-15"
                          >
                            {getPlatformDisplayName(platform.name)}
                          </a>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  {#if entry.description}
                    <div class="md:hidden w-full mt-1 bg-primary/5 p-2 text-center">
                      {entry.description}
                    </div>
                  {/if}
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}

  <div class="whitespace-pre-wrap text-wrap p-2 mt-2 bg-primary/15 rounded-box">
    {@html scheduleData.schedule?.note}
  </div>
</div>
