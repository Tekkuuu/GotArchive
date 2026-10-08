<script lang="ts">
	import type { z } from 'zod/v4';
	import { errorMessage } from '$lib/errors';
	import { AddScheduleSlotSchema, SCHEDULE_ENTRY_TYPES, WEEKDAYS } from './util';
	import type { Anime, Platform } from '$lib/server/db';
	import { Info, Power, PowerOff, Save, X } from 'lucide-svelte';
	import { sineInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { modalUtils } from '$lib/components/util';
	import { notification } from '$lib/components/ui/toaster';
	import { invalidateAll } from '$app/navigation';
	import { createScheduleSlot } from '$lib/remote/slot.remote';

	type SlotForm = z.infer<typeof AddScheduleSlotSchema>;

	interface Props {
		id: string;
		data?: SlotForm | null;
		availableAnime?: Anime[];
		platforms?: Platform[];
	}

	let { id, data, availableAnime, platforms }: Props = $props();

	function emptySlot(): SlotForm {
		return {
			dayOfWeek: 0,
			time: null,
			type: 'misc',
			animeId: null,
			title: null,
			description: null,
			logoUrl: null,
			episodeCount: null,
			cancelledText: null,
			note: null,
			isActive: true,
			platforms: [],
			duplicateToDays: []
		};
	}

	// Remount-initialised form state; no $effect sync needed.
	// svelte-ignore state_referenced_locally
	let form = $state<SlotForm>(data ? { ...data } : emptySlot());
	// svelte-ignore state_referenced_locally
	let animeInputValue = $state(
		data?.animeId
			? (availableAnime?.find((a) => a.animeId === data.animeId)?.titleEnglish ?? '')
			: ''
	);
	// svelte-ignore state_referenced_locally
	let selectedDays = $state<number[]>(
		data ? [...new Set([data.dayOfWeek, ...data.duplicateToDays])].sort((a, b) => a - b) : [0]
	);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (selectedDays.length === 0) {
			notification.error('Select at least one day of the week');
			return;
		}

		const [dayOfWeek, ...duplicateToDays] = selectedDays;

		try {
			await createScheduleSlot({ ...form, dayOfWeek, duplicateToDays });
			notification.success('Schedule slot created successfully');
			modalUtils.closeModal(id);
			await invalidateAll();
		} catch (err) {
			notification.error(errorMessage(err, 'Failed to create schedule slot'));
		}
	}
</script>

<dialog class="modal" {id}>
	<div class="modal-box bg-base-200 container">
		<form onsubmit={handleSubmit} class="space-y-4">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold">Schedule Slot</h2>
				<button
					type="button"
					class="btn btn-ghost btn-circle btn-sm"
					onclick={() => modalUtils.closeModal(id)}
				>
					<X class="size-4" />
				</button>
			</div>

			<!-- Days -->
			<div class="card bg-base-300">
				<div class="card-body p-4">
					<h3 class="mb-1 font-bold">Days of the Week</h3>
					<p class="text-base-content/60 mb-2 text-xs">
						Select one or more days. Every selected day gets an identical slot.
					</p>
					<div class="grid grid-cols-2 gap-2 md:grid-cols-7">
						{#each WEEKDAYS as weekday}
							{@const selected = selectedDays.includes(weekday.value)}
							<button
								type="button"
								class="btn w-full {selected ? 'btn-success' : 'btn-neutral'}"
								onclick={() => {
									selectedDays = selected
										? selectedDays.filter((day) => day !== weekday.value)
										: [...selectedDays, weekday.value].sort((a, b) => a - b);
								}}
							>
								{weekday.label}
							</button>
						{/each}
					</div>
				</div>
			</div>

			<!-- Basic -->
			<div class="card bg-base-300">
				<div class="card-body p-4">
					<h3 class="mb-2 font-bold">Basic Information</h3>
					<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
						<label class="input w-full">
							<span class="label">Time</span>
							<input
								type="time"
								bind:value={() => form.time ?? '', (v) => (form.time = v === '' ? null : v)}
							/>
						</label>
						<label class="select w-full">
							<span class="label">Type</span>
							<select bind:value={form.type}>
								{#each SCHEDULE_ENTRY_TYPES as type}
									<option value={type.value}>{type.label}</option>
								{/each}
							</select>
						</label>
					</div>
				</div>
			</div>

			<!-- Content -->
			{#if form.type === 'anime'}
				<div
					class="card bg-base-300"
					transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}
				>
					<div class="card-body p-4">
						<h3 class="mb-2 font-bold">Anime Information</h3>
						<label class="input w-full">
							<datalist id="anime-list">
								{#each availableAnime ?? [] as anime}
									<option value={anime.titleEnglish}></option>
								{/each}
							</datalist>
							<span class="label">Anime</span>
							<input
								type="text"
								list="anime-list"
								bind:value={animeInputValue}
								oninput={(e) => {
									form.animeId =
										availableAnime?.find((anime) => anime.titleEnglish === e.currentTarget.value)
											?.animeId || null;
								}}
							/>
						</label>

						<label class="input w-full">
							<span class="label">Episode Count</span>
							<input
								type="number"
								min="1"
								bind:value={
									() => form.episodeCount ?? '',
									(v) => (form.episodeCount = v === '' ? null : Number(v))
								}
							/>
						</label>

						<label class="input w-full">
							<span class="label">Title</span>
							<input
								type="text"
								bind:value={() => form.title ?? '', (v) => (form.title = v === '' ? null : v)}
								placeholder="Override"
							/>
						</label>
						<label class="input w-full">
							<span class="label">Description</span>
							<input
								class="w-full"
								bind:value={
									() => form.description ?? '', (v) => (form.description = v === '' ? null : v)
								}
								placeholder="Override"
							/>
						</label>
						<label class="input w-full">
							<span class="label">Logo URL</span>
							<input
								type="url"
								bind:value={() => form.logoUrl ?? '', (v) => (form.logoUrl = v === '' ? null : v)}
								placeholder="Override"
							/>
						</label>
						{#if form.logoUrl}
							<img
								src={form.logoUrl}
								alt="Content logo"
								class="max-h-24 w-auto object-contain"
								transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}
							/>
						{/if}
					</div>
				</div>
			{:else if form.type === 'misc'}
				<!-- Content -->
				<div
					class="card bg-base-300"
					transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}
				>
					<div class="card-body p-4">
						<h3 class="mb-2 font-bold">Content Details</h3>
						<div class="grid grid-cols-1 gap-2">
							<label class="input w-full">
								<span class="label">Title <span class="text-error">*</span></span>
								<input
									type="text"
									bind:value={() => form.title ?? '', (v) => (form.title = v === '' ? null : v)}
									placeholder="Content title"
									required
								/>
							</label>
							<label class="input w-full">
								<span class="label">Description (Optional)</span>
								<input
									class="w-full"
									bind:value={
										() => form.description ?? '', (v) => (form.description = v === '' ? null : v)
									}
									placeholder="Brief description"
								/>
							</label>
							<label class="input w-full">
								<span class="label">Logo URL (Optional)</span>
								<input
									type="url"
									bind:value={() => form.logoUrl ?? '', (v) => (form.logoUrl = v === '' ? null : v)}
									placeholder="https://example.com/logo.png"
								/>
							</label>
							{#if form.logoUrl}
								<img
									src={form.logoUrl}
									alt="Content logo"
									class="max-h-24 w-auto object-contain"
									transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}
								/>
							{/if}
						</div>
					</div>
				</div>
			{/if}

			<!-- Options -->
			<div class="card bg-base-300">
				<div class="card-body p-4">
					<h3 class="mb-2 font-bold">Additional Options</h3>
					<div class="grid grid-cols-1 gap-2">
						<label class="input w-full">
							<span class="label">Note</span>
							<input
								type="text"
								class="w-full"
								bind:value={() => form.note ?? '', (v) => (form.note = v === '' ? null : v)}
							/>
						</label>
						<label class="input w-full">
							<span class="label">Cancelled Text</span>
							<input
								type="text"
								bind:value={
									() => form.cancelledText ?? '', (v) => (form.cancelledText = v === '' ? null : v)
								}
							/>
						</label>
					</div>
				</div>
			</div>

			<!-- Platforms -->
			<div class="card bg-base-300">
				<div class="card-body p-4">
					<h3 class="mb-2 font-bold">Platforms</h3>
					<div class="flex flex-wrap gap-2">
						{#each platforms ?? [] as platform}
							{@const isSelected = form.platforms.some((p) => p.platformId === platform.platformId)}
							<button
								type="button"
								class="badge badge-lg badge-primary transition-colors {isSelected
									? ''
									: 'badge-outline'}"
								onclick={() => {
									if (isSelected) {
										form.platforms = form.platforms.filter(
											(p) => p.platformId !== platform.platformId
										);
									} else {
										form.platforms = [...form.platforms, { platformId: platform.platformId }];
									}
								}}
							>
								{platform.name}
							</button>
						{/each}
					</div>
					{#if (platforms ?? []).length === 0}
						<div class="text-base-content/60 flex items-center gap-2 text-sm">
							<Info class="size-4" />
							<span>No platforms available</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Actions -->
			<div class="flex gap-2">
				<button type="submit" class="btn btn-success flex-1">
					<Save class="size-4" />
					Save Slot
				</button>
				<button type="button" class="btn btn-error" onclick={() => modalUtils.closeModal(id)}>
					Cancel
				</button>
				<label
					class="swap btn bg-success rounded-field transition-color p-2 duration-150"
					id="add-schedule-slot-active-toggle"
				>
					<input
						type="checkbox"
						bind:checked={form.isActive}
						onchange={() => {
							document
								.getElementById('add-schedule-slot-active-toggle')
								?.classList.toggle('bg-success', form.isActive);
							document
								.getElementById('add-schedule-slot-active-toggle')
								?.classList.toggle('bg-error', !form.isActive);
						}}
					/>
					<Power class="swap-on text-base-200" />
					<PowerOff class="swap-off text-base-200" />
				</label>
			</div>
		</form>
	</div>
</dialog>
