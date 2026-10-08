<script lang="ts">
	import type { PageProps } from './$types';
	import { Plus, Calendar, Power, Info, ChevronDown } from 'lucide-svelte';
	import { DAY_NAMES } from './util';
	import { formatTime as formatTimeRaw } from '$lib/util/scheduleEntry';
	import { slide } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import AddScheduleSlot from '$lib/components/schedule/slot/AddScheduleSlot.svelte';
	import EditScheduleSlot from '$lib/components/schedule/slot/EditScheduleSlot.svelte';
	import SlotCard, { type SlotRow } from '$lib/components/schedule/slot/SlotCard.svelte';
	import { modalUtils } from '$lib/components/util';
	import { notification } from '$lib/components/ui/toaster';
	import { invalidateAll } from '$app/navigation';
	import { toggleScheduleSlot, deleteScheduleSlot } from '$lib/remote/slot.remote';
	import { AddScheduleSlotSchema, EditScheduleSlotSchema } from '$lib/schemas';
	import { z } from 'zod/v4';

	let { data }: PageProps = $props();

	const addSlotId = 'add-slot';
	const editSlotId = 'edit-slot';

	let addModalState = $state<z.infer<typeof AddScheduleSlotSchema>>();

	// Remount key.
	let addModalKey = $state(0);
	let editModalKey = $state(0);

	let editModalState = $state<{
		data: z.infer<typeof EditScheduleSlotSchema> | null;
		slotId: string | null;
		slotType: string | null;
		animeTitle: string | null;
		animeId: string;
	}>({
		data: null,
		slotId: null,
		slotType: null,
		animeTitle: null,
		animeId: ''
	});

	const slots = $derived(data.slots);

	// Group by DB day.
	const slotsByDay = $derived(
		Object.groupBy(
			slots.filter((s) => s.slot.isActive),
			(s) => s.slot.dayOfWeek
		)
	);

	const inactiveSlots = $derived(slots.filter((s) => !s.slot.isActive));

	let showInactive = $state(false);

	function openDuplicateModal(slotData: SlotRow) {
		const { slot, platforms: slotPlatforms } = slotData;

		const validPlatformNames = (slotPlatforms || []).filter(
			(name): name is string => name !== null
		);
		const platforms = validPlatformNames
			.map((name) => {
				const platform = data.platforms.find((p) => p.name === name);
				return platform ? { platformId: platform.platformId } : null;
			})
			.filter((p): p is { platformId: string } => p !== null);

		addModalState = {
			dayOfWeek: slot.dayOfWeek,
			time: slot.time,
			type: slot.type,
			animeId: slot.animeId,
			title: slot.title,
			description: slot.description,
			logoUrl: slot.logoUrl,
			episodeCount: slot.episodeCount,
			cancelledText: slot.cancelledText,
			note: slot.note,
			isActive: true,
			platforms: platforms,
			duplicateToDays: []
		};

		addModalKey++;
		modalUtils.openModal(addSlotId);
	}

	function openEditModal(slotData: SlotRow) {
		const { slot, anime, platforms: slotPlatforms } = slotData;

		const validPlatformNames = (slotPlatforms || []).filter(
			(name): name is string => name !== null
		);
		const platforms = validPlatformNames
			.map((name) => {
				const platform = data.platforms.find((p) => p.name === name);
				return platform ? { platformId: platform.platformId } : null;
			})
			.filter((p): p is { platformId: string } => p !== null);

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
				platforms
			},
			slotId: slot.scheduleSlotId,
			slotType: slot.type,
			animeTitle: anime?.titleEnglish || anime?.titleRomaji || anime?.titleNative || null,
			animeId: slot.animeId || ''
		};

		editModalKey++;
		modalUtils.openModal(editSlotId);
	}

	async function handleToggleSlot(slotId: string, isActive: boolean) {
		try {
			await toggleScheduleSlot({ slotId, isActive: !isActive });
			notification.success('Slot status updated successfully');
			await invalidateAll();
		} catch {
			notification.error('Failed to update slot status');
		}
	}

	async function handleDeleteSlot(slotId: string) {
		if (
			!window.confirm('Are you sure you want to delete this slot? This action cannot be undone.')
		) {
			return;
		}

		try {
			await deleteScheduleSlot({ slotId });
			notification.success('Slot deleted successfully');
			await invalidateAll();
		} catch {
			notification.error('Failed to delete slot');
		}
	}

	function formatTime(timeStr: string | null): string {
		return formatTimeRaw(timeStr, { utc: true, empty: 'Unknown time' });
	}
</script>

<svelte:head>
	<title>Schedule Slots | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto space-y-4">
	<!-- Header -->
	<div class="my-2 w-full">
		<h1 class="text-center text-3xl font-bold">Schedule Slots</h1>
		<p class="text-base-content/70 my-2 text-center">
			Manage templates for automatic schedule entry creation
		</p>
	</div>

	<button
		class="btn btn-primary my-2 w-full"
		onclick={() => {
			addModalState = undefined;
			addModalKey++;
			modalUtils.openModal(addSlotId);
		}}
	>
		<Plus class="size-5" />
	</button>

	<!-- Active -->
	<div class="space-y-6">
		{#each DAY_NAMES as dayName, dayIndex}
			{@const daySlots = slotsByDay[dayIndex] || []}

			<div class="card bg-base-200 shadow-xl">
				<div class="card-body">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="card-title">
							<Calendar class="size-5" />
							{dayName}
						</h2>
						<div class="flex items-center gap-2">
							<div class="badge badge-neutral">{daySlots.length} slot(s)</div>
						</div>
					</div>

					{#if daySlots.length === 0}
						<div
							class="rounded-box border-base-content/20 bg-base-300/30 text-base-content/60 flex items-center gap-2 border border-dashed p-4"
						>
							<Info class="size-5" />
							<span>No slots for this day. Create one to get started.</span>
						</div>
					{:else}
						<div class="space-y-2">
							{#each daySlots as slotData (slotData.slot.scheduleSlotId)}
								<SlotCard
									{slotData}
									active
									{formatTime}
									onToggle={handleToggleSlot}
									onEdit={openEditModal}
									onDuplicate={openDuplicateModal}
								/>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Inactive -->
	{#if inactiveSlots.length > 0}
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<button
					class="flex w-full cursor-pointer items-center justify-between"
					onclick={() => (showInactive = !showInactive)}
				>
					<h2 class="card-title">
						<Power class="size-5" />
						Inactive Slots
					</h2>
					<div class="flex items-center gap-2">
						<div class="badge badge-ghost">{inactiveSlots.length} slot(s)</div>
						<ChevronDown
							class="size-5 transition-transform duration-150"
							style="transform: rotate({showInactive
								? '0deg'
								: '-90deg'}); transition-timing-function: {sineInOut}"
						/>
					</div>
				</button>

				{#if showInactive}
					<div
						class="mt-4 space-y-2"
						transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}
					>
						{#each inactiveSlots as slotData (slotData.slot.scheduleSlotId)}
							{@const dayName = DAY_NAMES[slotData.slot.dayOfWeek]}
							<SlotCard
								{slotData}
								{dayName}
								active={false}
								{formatTime}
								onToggle={handleToggleSlot}
								onEdit={openEditModal}
								onDuplicate={openDuplicateModal}
								onDelete={handleDeleteSlot}
							/>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Empty -->
	{#if data.slots.length === 0}
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body items-center p-12 text-center">
				<Calendar class="text-base-content/30 mb-4 size-16" />
				<h3 class="mb-2 text-2xl font-bold">No Schedule Slots Yet</h3>
				<p class="text-base-content/70 mb-6">
					Schedule slots act as templates for automatic schedule creation.
					<br />
					Create your first slot to get started.
				</p>
				<button class="btn btn-primary" onclick={() => modalUtils.openModal(addSlotId)}>
					<Plus class="size-5" />
					Create First Slot
				</button>
			</div>
		</div>
	{/if}
</div>

{#key addModalKey}
	<AddScheduleSlot
		id={addSlotId}
		data={addModalState}
		availableAnime={data.anime}
		platforms={data.platforms}
	/>
{/key}

{#key editModalKey}
	<EditScheduleSlot
		id={editSlotId}
		data={editModalState.data}
		slotId={editModalState.slotId}
		slotType={editModalState.slotType}
		anime={{ animeTitle: editModalState.animeTitle, animeId: editModalState.animeId }}
		platforms={data.platforms}
	/>
{/key}
