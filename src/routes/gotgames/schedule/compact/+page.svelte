<script lang="ts">
	import banner from '$lib/assets/banner.jpg';
	import type { PageProps } from './$types';
	import { formatTime, getLogoUrl, formatAnimeSeasonDisplay } from '../util';
	import { ALL_WEEKDAYS } from '$lib/schemas';
	import { tzAbbreviation, groupEntriesByWeekday } from '$lib/api/schedule/datecode';
	import type { TimezoneAdjustedEntry } from '$lib/api/schedule/datecode';
	import { format, startOfISOWeek, endOfISOWeek, addDays } from 'date-fns';
	import { setISOWeek, setISOWeekYear } from 'date-fns';
	import GotExtraLogo from '$lib/assets/gotextra.png';
	import GotGamesLogo from '$lib/assets/gotgames.png';
	import PlatformIcon from '$lib/components/anime/PlatformIcon.svelte';
	import { page } from '$app/state';
	import { resolveTimeZone } from '$lib/stores';

	let { data }: PageProps = $props();

	const scheduleData = $derived(data.scheduleData);

	/** Raw `tz` query value (null = use persisted choice). */
	const tzParam = $derived(page.url.searchParams.get('tz'));

	/** Effective display zone: explicit param wins, else persisted store, else viewer zone, else UTC. */
	const timeZone = $derived(resolveTimeZone(tzParam));

	/** Active timezone label. */
	const activeTzLabel = $derived(timeZone);

	/** Short zone name for the displayed week (e.g. BST), DST-aware. */
	const tzShort = $derived.by(() => {
		if (!scheduleData) return timeZone;
		const ref = new Date(`${scheduleData.weekDateRange.start}T12:00:00Z`);
		return tzAbbreviation(timeZone, ref) ?? timeZone;
	});

	type EntriesByWeekday = Map<number, TimezoneAdjustedEntry[]>;

	const entriesByWeekday = $derived.by((): EntriesByWeekday => {
		if (!scheduleData) return new Map(ALL_WEEKDAYS.map((d) => [d, []]));
		const allEntries = [...scheduleData.entries, ...scheduleData.adjacentEntries];
		return groupEntriesByWeekday(allEntries, timeZone, scheduleData.weekDateRange, ALL_WEEKDAYS);
	});

	const dateRange = $derived.by(() => {
		const year = scheduleData.schedule.year;
		const week = scheduleData.schedule.week;

		// date-fns is non-mutating.
		const dated = setISOWeek(setISOWeekYear(new Date(), year), week);
		const weekStart = startOfISOWeek(dated);
		const weekEnd = endOfISOWeek(dated);

		return {
			range: `${format(weekStart, 'MMM do')} - ${format(weekEnd, 'MMM do')}`,
			start: weekStart,
			end: weekEnd
		};
	});
</script>

<svelte:head>
	<title>Schedule {data.datecode} | G.O.T Archive</title>
</svelte:head>

<div class="flex w-full justify-center">
	<div class="w-full max-w-6xl bg-zinc-900" id="schedule-compact">
		<!-- Header -->
		<img src={banner} alt="GotArchive schedule banner" class="w-full" />

		<div class="font-mplus2 bg-zinc-950 p-4 text-center text-amber-300">
			<h1 class="text-3xl font-bold">{dateRange.range}</h1>
			{#if activeTzLabel}
				<p class="mt-0.5 text-sm text-amber-300/60">Times shown in {tzShort}</p>
			{/if}
		</div>

		<div class="flex flex-col gap-3 p-5">
			{#each ALL_WEEKDAYS as dayIndex (dayIndex)}
				{@const dayEntries = entriesByWeekday.get(dayIndex) ?? []}
				<div class="grid grid-cols-[90px_1fr] gap-3">
					<!-- Day -->
					<div
						class="font-mplus2 flex min-h-12 items-center justify-center rounded-lg bg-amber-300 text-2xl font-extrabold text-zinc-950 uppercase"
					>
						<span>{format(addDays(dateRange.start, dayIndex), 'EEE')}</span>
					</div>

					<!-- Entries -->
					<div
						class="pattern-diagonal flex flex-col divide-y divide-zinc-700 overflow-hidden rounded-lg bg-zinc-800/40"
					>
						{#if dayEntries.length === 0}
							<div class="flex min-h-14 items-center gap-3 px-3 py-2"></div>
						{:else}
							{#each dayEntries as entry (entry.scheduleEntryId)}
								{@const logoUrl = getLogoUrl(entry)}
								{@const entryTitle = entry.title
									? entry.title
									: entry.animeSeasons?.[0]
										? formatAnimeSeasonDisplay(entry.animeSeasons[0])
										: ''}
								<div class="flex items-center gap-3 px-3 py-2">
									<!-- Logo -->
									{#if logoUrl}
										<div
											class="flex h-10 w-20 shrink-0 items-center justify-center rounded-sm bg-zinc-50 p-1"
										>
											<img
												src={logoUrl}
												alt={entryTitle ? `${entryTitle} logo` : ''}
												class="max-h-full max-w-full object-contain"
												style="filter: drop-shadow(0px 0px 1px rgba(0,0,0,1))"
											/>
										</div>
									{:else}
										<div class="h-10 w-20 shrink-0"></div>
									{/if}

									<!-- Time -->
									<div
										class="font-mplus2 text-base-content/70 w-14 shrink-0 text-center text-lg tabular-nums"
									>
										{#if entry.time}{formatTime(entry.time)}{/if}
									</div>

									<!-- Title -->
									<div class="font-mplus2 min-w-0 flex-1 text-xl leading-snug font-bold">
										{#if entry.animeSeasons && entry.animeSeasons.length > 0}
											<div class="flex flex-col gap-2">
												{#each entry.animeSeasons.sort((a, b) => a.sequence - b.sequence) as animeSeason}
													<div class="flex flex-wrap items-baseline gap-x-1.5">
														<span
															class={[entry.isCancelled && 'line-through decoration-red-500']}
															style="text-decoration-thickness: 3px"
														>
															{entry.title ? entry.title : formatAnimeSeasonDisplay(animeSeason)}
														</span>
														{#if entry.isCancelled}
															<span class="font-semibold text-red-500">
																{#if entry.cancelledText}
																	{entry.cancelledText}
																{:else}
																	CANCELLED
																{/if}
															</span>
														{:else if entry.description}
															<span class="font-normal text-amber-300">({entry.description})</span>
														{:else}
															<span class="font-normal text-amber-300">E{animeSeason.episodes}</span
															>
														{/if}
													</div>
												{/each}
											</div>
										{:else if entry.title}
											<div class="flex gap-2">
												<span
													class={[entry.isCancelled && 'line-through decoration-red-500']}
													style="text-decoration-thickness: 3px"
												>
													{entry.title}
												</span>
												{#if entry.isCancelled}
													<span class="font-semibold text-red-500">
														{#if entry.cancelledText}
															{entry.cancelledText}
														{:else}
															CANCELLED
														{/if}
													</span>
												{:else if entry.description}
													<span class="font-normal text-amber-300">({entry.description})</span>
												{/if}
											</div>
										{/if}
									</div>

									<!-- Platforms -->
									{#if entry.platforms && entry.platforms.length > 0}
										<div
											class="*:first:rounded-l-box *:last:rounded-r-box flex shrink-0 items-center"
										>
											{#each entry.platforms as platform}
												{#if platform.name.toLowerCase().includes('games')}
													<div class="size-9 bg-zinc-50 p-1">
														<img src={GotGamesLogo} alt="GOT Games" class="max-h-full max-w-full" />
													</div>
												{:else if platform.name.toLowerCase().includes('extra')}
													<div class="flex size-9 items-center justify-center bg-zinc-50 p-1">
														<img src={GotExtraLogo} alt="GOT Extra" class="max-h-full max-w-full" />
													</div>
												{:else if platform.iconSvg}
													<div class="relative size-9 bg-zinc-50 p-1">
														<PlatformIcon
															svg={platform.iconSvg}
															color={platform.iconColor}
															class="size-full"
														/>
													</div>
												{/if}
											{/each}
										</div>
									{/if}
								</div>
							{/each}
						{/if}
					</div>
				</div>
			{/each}
		</div>

		{#if scheduleData?.schedule.note}
			<div
				class="font-mplus2 bg-zinc-950 px-5 py-4 text-xl font-bold text-wrap whitespace-pre-wrap text-zinc-50"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- schedule notes are admin-authored -->
				{@html scheduleData.schedule.note}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Diagonal Lines */
	.pattern-diagonal {
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8'%3E%3Cpath d='M0 8 L8 0' stroke='%2352525b' stroke-width='0.1' opacity='0.5'/%3E%3C/svg%3E");
		background-size: 80px 80px;
	}
</style>
