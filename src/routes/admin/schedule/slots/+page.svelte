<script lang="ts">
	import type { PageProps } from './$types';
	import { Plus, Calendar, Clock, Edit, Power, Info, Copy, ChevronDown, PowerOff, Trash } from 'lucide-svelte';
	import { DAY_NAMES } from './util';
	import _ from 'lodash';
	import { format } from 'date-fns';
	import { slide } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import AddScheduleSlot from '$lib/components/schedule/slot/AddScheduleSlot.svelte';
	import EditScheduleSlot from '$lib/components/schedule/slot/EditScheduleSlot.svelte';
  import { modalUtils } from '$lib/components/util';
  import { enhance as defaultEnhance } from '$app/forms';
  import { toast } from '$lib/components/ui/toaster';
  import { invalidateAll } from '$app/navigation';

	let { data }: PageProps = $props();

  const addSlotId = 'add-slot';
  const editSlotId = 'edit-slot';

	// State for add modal (used for duplication)
	let addModalState = $state<{
		data: any | null;
	}>({
		data: null
	});

	// State for edit modal
	let editModalState = $state<{
		data: any | null;
		slotId: string | null;
		slotType: string | null;
		animeTitle: string | null;
		startingSeasonTitle: string | null;
		startingEpisode: number | null;
	}>({ 
		data: null,
		slotId: null, 
		slotType: null, 
		animeTitle: null,
		startingSeasonTitle: null,
		startingEpisode: null
	});

	// Reactive access to data properties
	let slots = $derived(data.slots);
	let animeSeasons = $derived(data.animeSeasons);

	// Helper to get color for type badge
	function getTypeColor(type: string): string {
		const colors: Record<string, string> = {
			anime: '#3b82f6',
			hololive: '#60a5fa',
			game: '#8b5cf6',
			event: '#ec4899',
			sponsored: '#f59e0b',
			misc: '#6b7280'
		};
		return colors[type] || '#6b7280';
	}

	// Store slots by day for dnd - this needs to be mutable
	let slotsByDay = $state<Record<number, typeof slots>>({});
	
	// Update slotsByDay when slots change
	$effect(() => {
		slotsByDay = _.groupBy(
			slots.filter((s) => s.slot.isActive),
			'slot.dayOfWeek'
		);
	});

	let inactiveSlots = $derived(slots.filter((s) => !s.slot.isActive));

	// Calculate next episode for each slot based on its position in the week
	let nextEpisodeMap = $derived.by(() => {
		const map = new Map<string, { seasonTitle: string; episodeStart: number; episodeEnd: number }>();

		const sortedSlots = [...slots]
			.filter((s) => s.slot.isActive)
			.sort((a, b) => {
				if (a.slot.dayOfWeek !== b.slot.dayOfWeek) {
					return a.slot.dayOfWeek - b.slot.dayOfWeek;
				}
				if (a.slot.time && b.slot.time) {
					return a.slot.time.localeCompare(b.slot.time);
				}
				return 0;
			});

		const animeProgress = new Map<string, { sequence: number; episode: number }>();

		for (const slotData of sortedSlots) {
			const { slot } = slotData;

			if (!slot.animeId || !slot.startingSequence || !slot.startingEpisode) {
				continue;
			}

			if (!animeProgress.has(slot.animeId)) {
				animeProgress.set(slot.animeId, {
					sequence: slot.startingSequence,
					episode: slot.startingEpisode
				});
			}

			const currentProgress = animeProgress.get(slot.animeId)!;
			const epCount = slot.episodeCount || 1;

			const episodeStart = currentProgress.episode;
			let episodeEnd = currentProgress.episode + epCount - 1;
			let currentSeq = currentProgress.sequence;

			const animeSeasonsForAnime = animeSeasons.filter((s) => s.animeId === slot.animeId) || [];
			const currentSeason = animeSeasonsForAnime.find((s) => s.sequence === currentSeq);

			if (currentSeason && currentSeason.episodes && episodeEnd > currentSeason.episodes) {
				episodeEnd = currentSeason.episodes;
			}

			// Get season title (prefer shortTitle, fallback to titleEnglish)
			const seasonTitle = currentSeason 
				? (currentSeason.shortTitle || currentSeason.titleEnglish || currentSeason.titleRomaji || currentSeason.titleNative || 'Unknown')
				: 'Unknown';

			map.set(slot.scheduleSlotId, {
				seasonTitle,
				episodeStart,
				episodeEnd
			});

			currentProgress.episode += epCount;

			if (currentSeason && currentSeason.episodes && currentProgress.episode > currentSeason.episodes) {
				const overflow = currentProgress.episode - currentSeason.episodes;
				currentProgress.sequence++;
				currentProgress.episode = overflow;

				const nextSeason = animeSeasonsForAnime.find((s) => s.sequence === currentProgress.sequence);
				if (!nextSeason) {
					currentProgress.sequence = currentSeason.sequence;
					currentProgress.episode = currentSeason.episodes;
				} else if (nextSeason.episodes && currentProgress.episode > nextSeason.episodes) {
					currentProgress.episode = nextSeason.episodes;
				}
			}
		}

		return map;
	});

	let showInactive = $state(false);

	function openDuplicateModal(slotData: typeof slots[0]) {
		const { slot, platforms: slotPlatforms } = slotData;

		// Map platform names to platform IDs (filter out null values from array_agg)
		const validPlatformNames = (slotPlatforms || []).filter((name): name is string => name !== null);
		const platforms = validPlatformNames
			.map((name) => {
				const platform = data.platforms.find((p) => p.name === name);
				return platform ? { platformId: platform.platformId } : null;
			})
			.filter((p): p is { platformId: string } => p !== null);

		// Find the animeSeasonId based on animeId and startingSequence
		const animeSeasonId = slot.animeId && slot.startingSequence
			? animeSeasons.find(
					(season) =>
						season.animeId === slot.animeId && season.sequence === slot.startingSequence
			  )?.animeSeasonId || null
			: null;

		// Set state for modal - copy all properties except IDs and active state
		addModalState = {
			data: {
				dayOfWeek: slot.dayOfWeek,
				time: slot.time,
				type: slot.type,
				animeId: slot.animeId,
				startingSequence: slot.startingSequence,
				startingEpisode: slot.startingEpisode,
				title: slot.title,
				description: slot.description,
				logoUrl: slot.logoUrl,
				episodeCount: slot.episodeCount,
				cancelledText: slot.cancelledText,
				note: slot.note,
				isActive: true, // Default to active for new slot
				platforms: platforms,
				duplicateToDays: [], // Empty by default
				animeSeasonId: animeSeasonId
			}
		};

		modalUtils.openModal(addSlotId);
	}

	function openEditModal(slotData: typeof slots[0]) {
		const { slot, anime, platforms: slotPlatforms } = slotData;

		// Map platform names to platform IDs (filter out null values from array_agg)
		const validPlatformNames = (slotPlatforms || []).filter((name): name is string => name !== null);
		const platforms = validPlatformNames
			.map((name) => {
				const platform = data.platforms.find((p) => p.name === name);
				return platform ? { platformId: platform.platformId } : null;
			})
			.filter((p): p is { platformId: string } => p !== null);

		// Get season title if this is an anime slot
		const startingSeasonTitle = slot.startingSequence && slot.animeId
			? animeSeasons.find(
					(season) =>
						season.animeId === slot.animeId && season.sequence === slot.startingSequence
			  )?.titleEnglish || null
			: null;

		// Set state for modal display
		editModalState = {
			data: {
				dayOfWeek: slot.dayOfWeek,
				time: slot.time,
				title: slot.title,
				description: slot.description,
				logoUrl: slot.logoUrl,
				episodeCount: slot.episodeCount,
				cancelledText: slot.cancelledText,
				note: slot.note,
				platforms: platforms
			},
			slotId: slot.scheduleSlotId,
			slotType: slot.type,
			animeTitle: anime?.titleEnglish || anime?.titleRomaji || anime?.titleNative || null,
			startingSeasonTitle,
			startingEpisode: slot.startingEpisode
		};

		modalUtils.openModal(editSlotId);
	}

	function formatTime(timeStr: string | null): string {
		try {
			const date = new Date(`1970-01-01T${timeStr}Z`);
			return format(date, 'HH:mm');
		} catch {
			return timeStr || 'Unknown time';
		}
	}
</script>

<svelte:head>
	<title>Schedule Slots | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto">
	<!-- Page Header -->
	<div class="my-2 w-full">
		<h1 class="text-3xl text-center font-bold">Schedule Slots</h1>
		<p class="text-base-content/70 my-2 text-center">
			Manage templates for automatic schedule entry creation
		</p>
	</div>

  <button
    class="btn btn-primary my-2 w-full"
    onclick={() => {modalUtils.openModal(addSlotId)}}
  >
    <Plus />
  </button>


	<!-- Active Slots by Day -->
	<div class="space-y-6">
		{#each DAY_NAMES as dayName, dayIndex}
			{@const daySlots = slotsByDay[dayIndex] || []}

			<div
        class="card bg-base-200 shadow-xl"
      >
				<div class="card-body">
					<div class="flex items-center justify-between mb-4">
						<h2 class="card-title">
							<Calendar class="h-5 w-5" />
							{dayName}
						</h2>
						<div class="flex items-center gap-2">
							<div class="badge badge-neutral">{daySlots.length} slot(s)</div>
						</div>
					</div>

					{#if daySlots.length === 0}
						<div
							class="border border-dashed rounded-box p-4 border-base-content/20 bg-base-300/30 text-base-content/60 gap-2 flex items-center"
						>
							<Info class="h-5 w-5" />
							<span>No slots for this day. Create one to get started.</span>
						</div>
					{:else}
						<div class="space-y-2">
							{#each daySlots as slotData (slotData.slot.scheduleSlotId)}
								{@const slot = slotData.slot}
								{@const animeData = slotData.anime}
								{@const nextEp = nextEpisodeMap.get(slot.scheduleSlotId)}

							  <div
                  class="card bg-base-300 hover:bg-base-100 transition-colors"
                >
									<div class="card-body p-4">
										<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
											<!-- Slot Info -->
											<div class="flex-1">
												<div class="flex items-center gap-2 flex-wrap mb-2">
													<div class="flex items-center gap-2">
														<Clock class="h-4 w-4" />
														<span class="font-semibold">{formatTime(slot.time)}</span>
													</div>

													{#if slot.type}
														<div
															class="badge badge-sm"
															style="background-color: {getTypeColor(slot.type)}; color: white;"
														>
															{slot.type}
														</div>
													{/if}
												</div>

												<!-- Title -->
												<p class="font-medium">
													{#if animeData}
														{animeData.titleEnglish || animeData.titleRomaji || animeData.titleNative}
														{#if animeData.shortTitle}
															<span class="text-sm text-base-content/60">
																({animeData.shortTitle})
															</span>
														{/if}
													{:else if slot.title}
														{slot.title}
													{:else}
														<span class="text-base-content/60 italic">No title set</span>
													{/if}
												</p>

												<!-- Next Episode -->
												{#if nextEp}
													<p class="text-sm text-base-content/70 mt-1">
														<span class="font-medium">Next:</span>
														{#if nextEp.episodeStart === nextEp.episodeEnd}
															{nextEp.seasonTitle} E{nextEp.episodeStart}
														{:else}
															{nextEp.seasonTitle} E{nextEp.episodeStart}-{nextEp.episodeEnd}
														{/if}
													</p>
												{/if}

												{#if slot.description}
													<p class="text-sm text-base-content/70 mt-1">{slot.description}</p>
												{/if}

												<!-- Additional Info -->
												<div class="flex gap-2 mt-2 flex-wrap">
													{#if slot.episodeCount}
														<div class="badge badge-outline badge-sm">
															{slot.episodeCount} ep/slot
														</div>
													{/if}
													{#if slotData.platforms && slotData.platforms.length > 0}
														{#each slotData.platforms as platform}
															{#if platform}
																<div class="badge badge-ghost badge-sm">{platform}</div>
															{/if}
														{/each}
													{/if}
												</div>
											</div>

											<!-- Actions -->
											<div class="flex gap-2 flex-wrap">
                        <form method="POST" action="?/toggleSlot" use:defaultEnhance={() => {
                          return async ({ result, update }) => {
                            if (result.type === 'success') {
                              toast.success('Slot status updated successfully');
                              await invalidateAll();
                            } else {
                              toast.error('Failed to update slot status');
                            }
                            await update();
                          };
                        }}>
                          <input type="hidden" name="slotId" value={slot.scheduleSlotId} />
                          <input type="hidden" name="slotActive" value={!slot.isActive} />
                          <button
                            type="submit"
                            class="btn btn-ghost btn-sm btn-square"
                            title="Deactivate"
                          >
                            <Power
                              class="h-4 w-4 text-success"
                            />
                          </button>
                        </form>
												<button
													class="btn btn-ghost btn-sm btn-square"
													title="Edit"
													onclick={() => openEditModal(slotData)}
												>
													<Edit class="h-4 w-4" />
												</button>
												<button
													class="btn btn-ghost btn-sm btn-square"
													title="Duplicate"
													onclick={() => openDuplicateModal(slotData)}
												>
													<Copy class="h-4 w-4" />
												</button>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Inactive Slots Section (Collapsed by Default) -->
	{#if inactiveSlots.length > 0}
		<div class="card bg-base-200 shadow-xl mt-6">
			<div class="card-body">
				<button
					class="flex items-center justify-between cursor-pointer w-full"
					onclick={() => (showInactive = !showInactive)}
				>
					<h2 class="card-title">
						<Power class="h-5 w-5" />
						Inactive Slots
					</h2>
					<div class="flex items-center gap-2">
						<div class="badge badge-ghost">{inactiveSlots.length} slot(s)</div>
						<ChevronDown
							class="h-5 w-5 transition-transform duration-150"
							style="transform: rotate({showInactive ? '0deg' : '-90deg'}); transition-timing-function: {sineInOut}"
						/>
					</div>
				</button>

				{#if showInactive}
					<div class="space-y-2 mt-4" transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}>
						{#each inactiveSlots as slot}
							{@const dayName = DAY_NAMES[slot.slot.dayOfWeek]}
							<div class="card bg-base-300/50 opacity-60">
								<div class="card-body p-4">
									<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<!-- Slot Info -->
										<div class="flex-1">
											<div class="flex items-center gap-2 flex-wrap mb-2">
												<span class="badge badge-sm">{dayName}</span>
												<div class="flex items-center gap-2">
													<Clock class="h-4 w-4" />
													<span class="font-semibold">{formatTime(slot.slot.time)}</span>
												</div>

												{#if slot.slot.type}
													<div
														class="badge badge-sm"
														style="background-color: {getTypeColor(slot.slot.type)}; color: white;"
													>
														{slot.slot.type}
													</div>
												{/if}
											</div>

											<!-- Title/Anime Name -->
											<p class="font-medium">
												{#if slot.anime}
													{slot.anime.titleEnglish || slot.anime.titleRomaji || slot.anime.titleNative}
												{:else if slot.slot.title}
													{slot.slot.title}
												{:else}
													<span class="text-base-content/60 italic">No title set</span>
												{/if}
											</p>
										</div>

										<!-- Actions -->
										<div class="flex gap-2 flex-wrap">
                      <form method="POST" action="?/toggleSlot" use:defaultEnhance={() => {
                        return async ({ result, update }) => {
                          if (result.type === 'success') {
                            toast.success('Slot status updated successfully');
                            await invalidateAll();
                          } else {
                            toast.error('Failed to update slot status');
                          }
                          await update();
                        };
                      }}>
                        <input type="hidden" name="slotId" value={slot.slot.scheduleSlotId} />
                        <input type="hidden" name="slotActive" value={!slot.slot.isActive} />
                        <button
                          type="submit"
                          class="btn btn-ghost btn-sm btn-square"
                          title='Activate'
                        >
                          <PowerOff class="h-4 w-4 text-error" />
                        </button>
                      </form>
											<button
												class="btn btn-ghost btn-sm btn-square"
												title="Edit"
												onclick={() => openEditModal(slot)}
											>
												<Edit class="h-4 w-4" />
											</button>
											<button
												class="btn btn-ghost btn-sm btn-square"
												title="Duplicate"
												onclick={() => openDuplicateModal(slot)}
											>
												<Copy class="h-4 w-4" />
											</button>
                      <form
                        method="POST"
                        action="?/deleteSlot"
                        use:defaultEnhance={() => {
                          return async ({ result, update }) => {
                            if (result.type === 'success') {
                              toast.success('Slot deleted successfully');
                              await invalidateAll();
                            } else {
                              toast.error('Failed to delete slot');
                            }
                            await update();
                          };
                        }}
                        onsubmit={(event) => {
                        if(!window.confirm('Are you sure you want to delete this slot? This action cannot be undone.')) {
                          event.preventDefault();
                        }
                      }}>
                        <input type="hidden" name="slotId" value={slot.slot.scheduleSlotId} />
                        <button
                          type="submit"
                          class="btn btn-ghost btn-sm btn-square"
                          title='Delete'
                        >
                          <Trash class="h-4 w-4 text-error" />
                        </button>
                      </form>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Empty State (No Slots at All) -->
	{#if data.slots.length === 0}
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body items-center text-center p-12">
				<Calendar class="h-16 w-16 text-base-content/30 mb-4" />
				<h3 class="text-2xl font-bold mb-2">No Schedule Slots Yet</h3>
				<p class="text-base-content/70 mb-6">
					Schedule slots act as templates for automatic schedule creation.
					<br />
					Create your first slot to get started.
				</p>
				<button class="btn btn-primary" onclick={() => {}}>
					<Plus class="h-5 w-5" />
					Create First Slot
				</button>
			</div>
		</div>
	{/if}
</div>

<AddScheduleSlot
  id={addSlotId}
  sForm={data.addForm}
  data={addModalState.data}
  availableAnime={data.anime}
  availableSeasons={data.animeSeasons}
  platforms={data.platforms}
  action="?/addSlot"
/>

<EditScheduleSlot
  id={editSlotId}
  sForm={data.editForm}
  action="?/editSlot"
  data={editModalState.data}
  slotId={editModalState.slotId}
  slotType={editModalState.slotType}
  animeTitle={editModalState.animeTitle}
  startingSeasonTitle={editModalState.startingSeasonTitle}
  startingEpisode={editModalState.startingEpisode}
  platforms={data.platforms}
/>
