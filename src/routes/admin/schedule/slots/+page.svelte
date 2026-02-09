<script lang="ts">
	import type { PageProps } from './$types';
	import { Plus, Calendar, Clock, Edit, Trash2, Power, Info } from 'lucide-svelte';
	import { DAY_NAMES } from './util';
	import _ from 'lodash';

	let { data }: PageProps = $props();

	// Group slots by day of week and active status
	let activeSlotsByDay = $derived(
		_.groupBy(
			data.slots.filter((s) => s.isActive),
			'dayOfWeek'
		)
	);

	let inactiveSlots = $derived(data.slots.filter((s) => !s.isActive));

	let showInactive = $state(false);

	function formatTime(time: string | null): string {
		if (!time) return 'No time set';
		// Convert 24h time to 12h format
		const [hours, minutes] = time.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	}

	function getTypeBadgeClass(type: string | null): string {
		if (!type) return 'badge-ghost';
		const typeMap: Record<string, string> = {
			anime: 'badge-primary',
			hololive: 'badge-secondary',
			game: 'badge-accent',
			event: 'badge-info',
			sponsored: 'badge-warning',
			misc: 'badge-neutral'
		};
		return typeMap[type] || 'badge-ghost';
	}
</script>

<svelte:head>
	<title>Schedule Slots | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-7xl p-4">
	<!-- Page Header -->
	<div class="mb-6">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold">Schedule Slots</h1>
				<p class="text-base-content/70 mt-2">
					Manage templates for automatic schedule entry creation
				</p>
			</div>
			<a href="/admin/schedule/slots/new" class="btn btn-primary">
				<Plus class="h-5 w-5" />
				New Slot
			</a>
		</div>
	</div>

	<!-- Active Slots by Day -->
	<div class="space-y-6">
		{#each DAY_NAMES as dayName, dayIndex}
			{@const daySlots = activeSlotsByDay[dayIndex] || []}

			<div class="card bg-base-200 shadow-xl">
				<div class="card-body">
					<div class="flex items-center justify-between mb-4">
						<h2 class="card-title">
							<Calendar class="h-5 w-5" />
							{dayName}
						</h2>
						<div class="badge badge-neutral">{daySlots.length} slot(s)</div>
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
							{#each daySlots as slot}
								<div class="card bg-base-300 hover:bg-base-100 transition-colors">
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
														<div class="badge {getTypeBadgeClass(slot.type)} badge-sm">
															{slot.type}
														</div>
													{/if}
												</div>

												<!-- Title/Anime Name -->
												<p class="font-medium">
													{#if slot.anime}
														{slot.anime.titleNative}
														{#if slot.anime.shortTitle}
															<span class="text-sm text-base-content/60">
																({slot.anime.shortTitle})
															</span>
														{/if}
													{:else if slot.title}
														{slot.title}
													{:else}
														<span class="text-base-content/60 italic">No title set</span>
													{/if}
												</p>

												{#if slot.description}
													<p class="text-sm text-base-content/70 mt-1">{slot.description}</p>
												{/if}

												<!-- Additional Info -->
												<div class="flex gap-2 mt-2 flex-wrap">
													{#if slot.startingSequence}
														<div class="badge badge-outline badge-sm">
															Season {slot.startingSequence}
														</div>
													{/if}
													{#if slot.startingEpisode}
														<div class="badge badge-outline badge-sm">
															Ep. {slot.startingEpisode}
														</div>
													{/if}
													{#if slot.episodeCount}
														<div class="badge badge-outline badge-sm">
															{slot.episodeCount} ep/slot
														</div>
													{/if}
													{#if slot.platforms && slot.platforms.length > 0}
														{#each slot.platforms as platform}
															<div class="badge badge-ghost badge-sm">{platform.name}</div>
														{/each}
													{/if}
												</div>
											</div>

											<!-- Actions -->
											<div class="flex gap-2 sm:flex-col">
												<a
													href="/admin/schedule/slots/{slot.scheduleSlotId}"
													class="btn btn-ghost btn-sm btn-square"
													title="Edit"
												>
													<Edit class="h-4 w-4" />
												</a>
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
						<span class="text-xs">{showInactive ? '▼' : '▶'}</span>
					</div>
				</button>

				{#if showInactive}
					<div class="space-y-2 mt-4">
						{#each inactiveSlots as slot}
							{@const dayName = DAY_NAMES[slot.dayOfWeek]}
							<div class="card bg-base-300/50 opacity-60">
								<div class="card-body p-4">
									<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
										<!-- Slot Info -->
										<div class="flex-1">
											<div class="flex items-center gap-2 flex-wrap mb-2">
												<span class="badge badge-sm">{dayName}</span>
												<div class="flex items-center gap-2">
													<Clock class="h-4 w-4" />
													<span class="font-semibold">{formatTime(slot.time)}</span>
												</div>

												{#if slot.type}
													<div class="badge {getTypeBadgeClass(slot.type)} badge-sm">
														{slot.type}
													</div>
												{/if}
											</div>

											<!-- Title/Anime Name -->
											<p class="font-medium">
												{#if slot.anime}
													{slot.anime.titleNative}
												{:else if slot.title}
													{slot.title}
												{:else}
													<span class="text-base-content/60 italic">No title set</span>
												{/if}
											</p>
										</div>

										<!-- Actions -->
										<div class="flex gap-2 sm:flex-col">
											<a
												href="/admin/schedule/slots/{slot.scheduleSlotId}"
												class="btn btn-ghost btn-sm btn-square"
												title="Edit"
											>
												<Edit class="h-4 w-4" />
											</a>
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
				<a href="/admin/schedule/slots/new" class="btn btn-primary">
					<Plus class="h-5 w-5" />
					Create First Slot
				</a>
			</div>
		</div>
	{/if}
</div>
