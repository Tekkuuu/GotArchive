<script lang="ts">
	import banner from '$lib/assets/banner.jpg';
	import type { PageProps } from './$types';
	import { formatTime, getLogoUrl, formatAnimeSeasonDisplay } from '../util';
	import {
		parseTzParam,
		tzLabel as resolveTzLabel,
		groupEntriesByWeekday
	} from '$lib/api/schedule/datecode';
	import type { TimezoneAdjustedEntry } from '$lib/api/schedule/datecode';
	import { format, startOfISOWeek, endOfISOWeek, addDays } from 'date-fns';
	import { setISOWeek, setISOWeekYear } from 'date-fns';
	import GotExtraLogo from '$lib/assets/gotextra.png';
	import GotGamesLogo from '$lib/assets/gotgames.png';
	import { page } from '$app/state';

	let { data }: PageProps = $props();

	const scheduleData = $derived(data.scheduleData);

	// All 7 ISO weekdays (0=Monday … 6=Sunday) are always rendered.
	// Days without entries get an empty array so the day header still shows.
	const ALL_WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;

	/** UTC offset in minutes — defaults to GMT when `tz` param is absent */
	const tzOffsetMinutes = $derived(parseTzParam(page.url.searchParams.get('tz')));

	/** Display label for the active timezone, e.g. "BST", "UTC+1" */
	const activeTzLabel = $derived(resolveTzLabel(page.url.searchParams.get('tz')));

	type EntriesByWeekday = Map<number, TimezoneAdjustedEntry[]>;

	const entriesByWeekday = $derived.by((): EntriesByWeekday => {
		if (!scheduleData) return new Map(ALL_WEEKDAYS.map((d) => [d, []]));
		const allEntries = [...scheduleData.entries, ...scheduleData.adjacentEntries];
		return groupEntriesByWeekday(
			allEntries,
			tzOffsetMinutes ?? 0,
			scheduleData.weekDateRange,
			ALL_WEEKDAYS
		);
	});

	const dateRange = $derived.by(() => {
		const year = scheduleData.schedule.year;
		const week = scheduleData.schedule.week;

		// setISOWeekYear / setISOWeek are non-mutating — must chain their return values
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

<div class="flex justify-center w-full">
	<div class="min-w-250 w-fit bg-zinc-900" id="schedule-compact">
		<!-- Header -->
		<img src={banner} alt="banner" class="w-250" />

		<div class="p-4 font-mplus2 text-amber-300 text-center bg-zinc-950">
			<h1 class="text-3xl font-bold">{dateRange.range}</h1>
		{#if activeTzLabel}
			<p class="text-sm text-amber-300/60 mt-0.5">Times shown in {activeTzLabel}</p>
		{/if}
		</div>

		<div class="flex flex-col gap-3 p-5">
			{#each ALL_WEEKDAYS as dayIndex (dayIndex)}
				{@const dayEntries = entriesByWeekday.get(dayIndex) ?? []}
				<div class="grid grid-cols-[90px_1fr] gap-3">
					<!-- Day header -->
					<div class="bg-amber-300 text-zinc-950 rounded-lg text-2xl font-extrabold font-mplus2 uppercase flex items-center justify-center min-h-12">
						<span>{format(addDays(dateRange.start, dayIndex), 'EEE')}</span>
					</div>

					<!-- Entries (or empty placeholder) -->
					<div class="flex flex-col divide-y divide-zinc-700/50 rounded-lg overflow-hidden bg-zinc-800/40">
						{#if dayEntries.length === 0}
							<div class="flex items-center gap-3 px-3 py-2 min-h-14"></div>
						{:else}
							{#each dayEntries as entry (entry.scheduleEntryId)}
								{@const logoUrl = getLogoUrl(entry)}
								<div class="flex items-center gap-3 px-3 py-2">
								<!-- Logo -->
								{#if logoUrl}
									<div class="w-20 h-10 shrink-0 bg-zinc-50 flex items-center justify-center rounded-sm p-1">
										<img
											src={logoUrl}
											alt=""
											class="max-w-full max-h-full object-contain"
											style="filter: drop-shadow(0px 0px 1px rgba(0,0,0,1))"
										/>
									</div>
								{:else}
									<div class="w-20 h-10 shrink-0"></div>
								{/if}

									<!-- Time -->
									<div class="w-14 shrink-0 text-center font-mplus2 text-lg tabular-nums text-base-content/70">
										{#if entry.time}{formatTime(entry.time)}{/if}
									</div>

									<!-- Title / Anime seasons -->
									<div class="flex-1 font-bold min-w-0 font-mplus2 text-xl leading-snug">
										{#if entry.animeSeasons && entry.animeSeasons.length > 0}
											<div class="flex flex-col gap-2">
												{#each entry.animeSeasons as animeSeason}
													<div class="flex flex-wrap items-baseline gap-x-1.5">
														<span
															class={[entry.isCancelled && 'line-through decoration-red-500']}
															style="text-decoration-thickness: 3px"
														>
															{entry.title ? entry.title : formatAnimeSeasonDisplay(animeSeason)}
														</span>
														{#if entry.isCancelled}
															<span class="text-red-500 font-semibold">
                                {#if entry.cancelledText}
                                  {entry.cancelledText}
                                {:else}
                                  CANCELLED
                                {/if}
															</span>
														{:else if entry.description}
															<span class="text-amber-300 font-normal">({entry.description})</span>
														{:else}
															<span class="text-amber-300 font-normal">E{animeSeason.episodes}</span>
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
                          <span class="text-red-500 font-semibold">
                            {#if entry.cancelledText}
                              {entry.cancelledText}
                            {:else}
                              CANCELLED
                            {/if}
                          </span>
                        {:else if entry.description}
                          <span class="text-amber-300 font-normal">({entry.description})</span>
                        {/if}
											</div>
										{/if}
									</div>

									<!-- Platforms -->
									{#if entry.platforms && entry.platforms.length > 0}
										<div class="flex items-center shrink-0 *:first:rounded-l-box *:last:rounded-r-box">
											{#each entry.platforms as platform}
												{#if platform.name.toLowerCase().includes('twitch')}
													<div class="relative size-9 p-1 bg-zinc-50">
														<svg class="fill-[#9146FF]" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
															<title>Twitch</title>
															<path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
														</svg>
													</div>
												{:else if platform.name.toLowerCase().includes('games')}
													<div class="size-9 p-1 bg-zinc-50">
														<img src={GotGamesLogo} alt="GOT Games" class="max-w-full max-h-full" />
													</div>
												{:else if platform.name.toLowerCase().includes('extra')}
													<div class="size-9 p-1 bg-zinc-50 flex justify-center items-center">
														<img src={GotExtraLogo} alt="GOT Extra" class="max-w-full max-h-full" />
													</div>
												{:else if platform.name.toLowerCase().includes('patreon')}
													<div class="relative size-9 p-1 bg-zinc-50">
														<svg class="fill-[#000000]" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
															<title>Patreon</title>
															<path d="M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.231 1.093 7.391 1.046 11.54c-.039 3.411.302 12.396 5.369 12.46 3.765.047 4.326-4.804 6.068-7.141 1.24-1.662 2.836-2.132 4.801-2.618 3.376-.836 5.678-3.501 5.673-7.031Z" />
														</svg>
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
			<div class="bg-zinc-950 px-5 py-4 font-mplus2 text-zinc-50 text-xl font-bold whitespace-pre-wrap text-wrap">
				{@html scheduleData.schedule.note}
			</div>
		{/if}
	</div>
</div>
