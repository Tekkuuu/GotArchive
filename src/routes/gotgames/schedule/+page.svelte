<script lang="ts">
	import type { PageProps } from './$types';
	import type { SchedulePageData } from './types';
	import { ChevronLeft, ChevronRight, Calendar, Info, X, ImageOff, Clock } from 'lucide-svelte';
	import { addWeeks, subWeeks, getISOWeek, getISOWeekYear } from 'date-fns';
	import { onMount } from 'svelte';
	import { formatTime, getLogoUrl, formatAnimeSeasonDisplay } from './util';
	import { WEEKDAYS } from '$lib/schemas';
	import { notification } from '$lib/components/ui/toaster';
	import { PlatformBadge } from '$lib/components/anime';
	import {
		tzAbbreviation,
		groupEntriesByWeekday,
		isoWeekDateRange
	} from '$lib/api/schedule/datecode';
	import type { TimezoneAdjustedEntry } from '$lib/api/schedule/datecode';
	import { page } from '$app/state';
	import { resolveTimeZone } from '$lib/stores';

	let { data }: PageProps = $props();

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

	/** Raw `tz` query value (null = use persisted choice). */
	const tzParam = $derived(page.url.searchParams.get('tz'));

	/** Effective display zone: explicit param wins, else persisted store, else viewer zone, else UTC. */
	const timeZone = $derived(resolveTimeZone(tzParam));

	/** Active timezone label. */
	const activeTzLabel = $derived(timeZone);

	/** Short zone name for the displayed week (e.g. BST), DST-aware. */
	const tzShort = $derived.by(() => {
		const ref = new Date(`${scheduleData.weekDateRange.start}T12:00:00Z`);
		return tzAbbreviation(timeZone, ref) ?? timeZone;
	});

	const entriesByWeekday = $derived.by((): Map<number, TimezoneAdjustedEntry[]> => {
		const allEntries = [...scheduleData.entries, ...scheduleData.adjacentEntries];
		const groups = groupEntriesByWeekday(allEntries, timeZone, scheduleData.weekDateRange);

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
	 * Navigates to week.
	 * @param year - Year.
	 * @param week - ISO week.
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

			history.pushState({ year, week }, '', `/gotgames/schedule?year=${year}&week=${week}`);
		} catch (err) {
			console.error('Error fetching schedule', { error: String(err) });
			errorMessage = 'Network error while loading schedule';
			notification.error('Network error while loading schedule');
		} finally {
			loading = false;
		}
	}

	/** Navigates to previous week. */
	function goToPrevWeek() {
		const currentDate = new Date(scheduleData.currentYear, 0, 1);
		currentDate.setDate(currentDate.getDate() + (scheduleData.currentWeek - 1) * 7);
		const prevDate = subWeeks(currentDate, 1);

		const prevYear = getISOWeekYear(prevDate);
		const prevWeek = getISOWeek(prevDate);

		navigateToWeek(prevYear, prevWeek);
	}

	/** Navigates to next week. */
	function goToNextWeek() {
		const currentDate = new Date(scheduleData.currentYear, 0, 1);
		currentDate.setDate(currentDate.getDate() + (scheduleData.currentWeek - 1) * 7);
		const nextDate = addWeeks(currentDate, 1);

		const nextYear = getISOWeekYear(nextDate);
		const nextWeek = getISOWeek(nextDate);

		navigateToWeek(nextYear, nextWeek);
	}

	/** Handles browser back/forward. */
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
	<meta name="description" content="View the current week's streaming schedule on G.O.T Archive" />
</svelte:head>

<div class="container mx-auto max-w-7xl p-2">
	<!-- Navigation -->
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
			<h1 class="flex items-center gap-2 text-xl font-bold">
				<Calendar class="size-5" />
				{scheduleData.weekRange}
			</h1>
			{#if activeTzLabel}
				<p class="text-base-content/50 text-xs">Times shown in {tzShort}</p>
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

	<!-- Loading -->
	{#if loading}
		<div class="flex items-center justify-center py-2">
			<span class="loading loading-spinner loading-md"></span>
		</div>
	{/if}

	<!-- Error -->
	{#if errorMessage}
		<div class="alert alert-error mb-2">
			<Info class="size-5" />
			<span>{errorMessage}</span>
		</div>
	{/if}

	<!-- Entries -->
	{#if scheduleData.entries.length === 0}
		<div
			class="rounded-box border-base-content/20 bg-base-300/30 text-base-content/60 flex items-center justify-center gap-2 border border-dashed p-2"
		>
			<Info class="size-5" />
			<span>No entries scheduled for this week</span>
		</div>
	{:else}
		<div class="space-y-2">
			{#each Array.from(entriesByWeekday.entries()).sort((a, b) => a[0] - b[0]) as [dayIndex, dayEntries]}
				<div class="card">
					<div class="card-body group gap-0 p-0">
						<!-- Weekday -->
						<div
							class={[
								'bg-primary/15 group-hover:bg-primary text-base-content',
								'rounded-box flex items-center justify-between rounded-b-none p-2',
								'transition-colors duration-150'
							]}
						>
							<span class="text-lg font-bold">{WEEKDAYS[dayIndex].label}</span>
						</div>

						<!-- List -->
						<div
							class="border-primary/15 rounded-b-box group-hover:border-primary border-2 p-2 transition-colors duration-150"
						>
							{#each dayEntries as entry (entry.scheduleEntryId)}
								{@const logoUrl = getLogoUrl(entry)}
								<div
									class={[
										'rounded-box relative flex flex-col items-center',
										'bg-primary/5 group/entry hover:bg-primary/25 border-primary/15 group-hover:border-primary transition-colors duration-150 not-last:border-b-2',
										'first:rounded-t-box last:rounded-b-box rounded-none'
									]}
								>
									<div class="flex w-full items-center justify-center gap-2 p-2">
										<!-- Cancelled -->
										{#if entry.isCancelled}
											<div
												class="rounded-box absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-black/60 transition-all duration-200 hover:bg-black/20"
											>
												<div class="text-error flex items-center justify-center gap-1 font-bold">
													<X />
													<span>Cancelled</span>
												</div>
												{#if entry.cancelledText}
													<span class="text-base-content/80 text-sm">{entry.cancelledText}</span>
												{/if}
											</div>
										{/if}

										<!-- Logo -->
										<div class="hidden h-12 w-60 shrink-0 items-center justify-center sm:flex">
											{#if logoUrl}
												<img
													src={logoUrl}
													alt={`Logo for ${entry.title}`}
													loading="lazy"
													decoding="async"
													class="max-h-full max-w-full object-contain drop-shadow-[0_0_3px_rgba(0,0,0,0.7)] drop-shadow-[0_0_3px_rgba(255,255,255,0.9)]"
												/>
											{:else}
												<ImageOff class="text-base-content/70" />
											{/if}
										</div>

										<div
											class={[
												'hidden sm:flex',
												'divider divider-horizontal divider-primary/25 group-hover/entry:divider-primary',
												'm-0 transition-colors duration-150'
											]}
										></div>

										<!-- Info -->
										<div class="flex w-20 flex-col items-center justify-center gap-1">
											<div class="flex items-center justify-center gap-2">
												<Clock class="size-4" />
												<span class="">{formatTime(entry.time)}</span>
											</div>
											<div class="text-primary font-bold capitalize">{entry.type}</div>
										</div>

										<div
											class={[
												'divider divider-horizontal divider-primary/25 group-hover/entry:divider-primary',
												'm-0 transition-colors duration-150'
											]}
										></div>

										<!-- Title -->
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
														<span class="text-primary font-bold">
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
										<div class="text-primary flex grow font-bold max-md:hidden">
											{#if entry.description}
												<span>{entry.description}</span>
											{/if}
										</div>

										<!-- Platforms -->
										{#if entry.platforms && entry.platforms.length > 0}
											<div
												class="*:first:rounded-l-box *:last:rounded-r-box flex shrink-0 items-center max-md:grow max-md:justify-end"
											>
												{#each entry.platforms as platform (platform.platformId)}
													<a
														href={platform.url}
														target="_blank"
														rel="noopener noreferrer"
														title={platform.name}
														aria-label={platform.name}
														class="block size-9 bg-zinc-50 p-1 transition-opacity duration-150 hover:opacity-70"
													>
														<PlatformBadge
															name={platform.name}
															iconSvg={platform.iconSvg}
															iconColor={platform.iconColor}
														/>
													</a>
												{/each}
											</div>
										{/if}
									</div>
									{#if entry.description}
										<div class="bg-primary/5 mt-1 w-full p-2 text-center md:hidden">
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

	{#if scheduleData.schedule?.note}
		<div class="bg-primary/15 rounded-box mt-2 p-2 text-wrap whitespace-pre-wrap">
			<!-- eslint-disable-next-line svelte/no-at-html-tags -- schedule notes are admin-authored -->
			{@html scheduleData.schedule?.note}
		</div>
	{/if}
</div>
