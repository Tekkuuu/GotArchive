<script lang="ts">
  import banner from '$lib/assets/banner.jpg';
	import type { PageProps } from './$types';
	import { formatTime, getLogoUrl, formatAnimeSeasonDisplay } from '../util';
	import { format, setISOWeekYear, setISOWeek, startOfISOWeek, endOfISOWeek, addDays } from 'date-fns';

	let { data }: PageProps = $props();

	const scheduleData = $derived(data.scheduleData);

	type EntriesByWeekday = Map<number, typeof scheduleData.entries>;

  // TODO: Verify entry being never[]
	const entriesByWeekday = $derived.by((): EntriesByWeekday => {
		if (!scheduleData) return new Map();
		const groups: EntriesByWeekday = new Map();
		for (const entry of scheduleData.entries) {
			if (!groups.has(entry.dayOfWeek)) groups.set(entry.dayOfWeek, []);
			groups.get(entry.dayOfWeek)!.push(entry);
		}
		return groups;
	});

  const dateRange = $derived.by(() => {
    const year = scheduleData.schedule.year;
    const week = scheduleData.schedule.week;

    let date = new Date();
    setISOWeekYear(date, year);
    setISOWeek(date, week);
    const weekStart = startOfISOWeek(date);
    const weekEnd = endOfISOWeek(date);

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
    </div>

    {#if !scheduleData || scheduleData.entries.length === 0}
      <p class="text-center text-base-content/60">No entries scheduled for this week.</p>
    {:else}
      <div class="flex flex-col gap-3 p-5">
        {#each Array.from(entriesByWeekday.entries()).sort((a, b) => a[0] - b[0]) as [dayIndex, dayEntries]}
          <div class="grid grid-cols-[90px_1fr] gap-3">
            <!-- Day header -->
            <div class="bg-amber-300 text-zinc-950 rounded-lg text-2xl font-extrabold font-mplus2 uppercase flex items-center justify-center min-h-12">
              <span>{format(addDays(dateRange.start, dayIndex), 'EEE')}</span>
            </div>

            <!-- Entries -->
            <div class="flex flex-col divide-y divide-zinc-700/50 rounded-lg overflow-hidden bg-zinc-800/40">
              {#each dayEntries as entry (entry.scheduleEntryId)}
                {@const logoUrl = getLogoUrl(entry)}
                <div class="flex items-center gap-3 px-3 py-2">
                  <!-- Logo -->
                  <div class="w-20 h-10 shrink-0 flex items-center justify-center">
                    {#if logoUrl}
                      <img src={logoUrl} alt="" class="max-w-full max-h-full object-contain" />
                    {/if}
                  </div>

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
                              <span class="text-red-500 text-base font-semibold">
                                CANCELLED{entry.cancelledText ? ` — ${entry.cancelledText}` : ''}
                              </span>
                            {:else if entry.description}
                              <span class="text-base-content/60 text-base font-normal">({entry.description})</span>
                            {:else}
                              <span class="text-indigo-700 font-bold text-base">E{animeSeason.episodes}</span>
                            {/if}
                          </div>
                        {/each}
                      </div>
                    {:else if entry.title}
                      <div class="flex gap-2">
                        <span class="truncate block">{entry.title}</span>
                        {#if entry.description}
                          <p class="text-sm text-base-content/60 truncate font-normal">{entry.description}</p>
                        {/if}
                      </div>
                    {/if}
                  </div>

                  <!-- Platforms -->
                  {#if entry.platforms && entry.platforms.length > 0}
                    <div class="flex items-center join shrink-0">
                      {#each entry.platforms as platform}
                        {#if platform.name.toLowerCase().includes('twitch')}
                          <div class="relative join-item size-9 p-1.5 bg-zinc-50">
                            <svg class="fill-[#9146FF]" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <title>Twitch</title>
                              <path
                                d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"
                              />
                            </svg>
                          </div>
                        {:else if platform.name.toLowerCase().includes('youtube')}
                          <div class="relative join-item size-9 p-1.5 bg-zinc-950">
                            <svg class="fill-[#FF0000]" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <title>YouTube</title>
                              <path
                                d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"
                              />
                            </svg>
                            {#if platform.name.toLowerCase().includes('extra')}
                              <div class="absolute -top-1 -right-1 size-3 rounded-full bg-green-400"></div>
                            {/if}
                          </div>
                        {:else if platform.name.toLowerCase().includes('patreon')}
                          <div class="relative join-item size-9 p-1.5 bg-zinc-50">
                            <svg class="fill-[#000000]" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <title>Patreon</title>
                              <path
                                d="M22.957 7.21c-.004-3.064-2.391-5.576-5.191-6.482-3.478-1.125-8.064-.962-11.384.604C2.357 3.231 1.093 7.391 1.046 11.54c-.039 3.411.302 12.396 5.369 12.46 3.765.047 4.326-4.804 6.068-7.141 1.24-1.662 2.836-2.132 4.801-2.618 3.376-.836 5.678-3.501 5.673-7.031Z"
                              />
                            </svg>
                          </div>
                        {/if}
                      {/each}
                    </div>
                  {/if}
                </div>
              {/each}
            </div>
          </div>
        {/each}
      </div>
      {#if scheduleData.schedule.note}
        <div class="bg-zinc-950 px-5 py-4 font-mplus2 text-zinc-50 text-xl font-bold whitespace-pre-wrap text-wrap">
          {scheduleData.schedule.note}
        </div>
      {/if}
    {/if}
  </div>
</div>
