<script lang="ts">
	import type { z } from 'zod/v4';
	import { errorMessage } from '$lib/errors';
	import { EditScheduleSlotSchema } from './util';
	import type { Platform } from '$lib/server/db';
	import { Info, Save, X, Lock } from 'lucide-svelte';
	import { sineInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { modalUtils } from '$lib/components/util';
	import { notification } from '$lib/components/ui/toaster';
	import { invalidateAll } from '$app/navigation';
	import { updateScheduleSlot } from '$lib/remote/slot.remote';

	type SlotForm = z.infer<typeof EditScheduleSlotSchema>;

	interface Props {
		id: string;
		data: SlotForm | null;
		slotId: string | null;
		slotType: string | null;
		anime: { animeId: string; animeTitle: string | null };
		platforms?: Platform[];
	}

	let { id, data, slotId, slotType, anime, platforms }: Props = $props();

	function emptySlot(): SlotForm {
		return {
			dayOfWeek: 0,
			time: null,
			title: null,
			description: null,
			logoUrl: null,
			episodeCount: null,
			cancelledText: null,
			note: null,
			platforms: []
		};
	}

	// Remount-initialised form state; no $effect sync needed.
	// svelte-ignore state_referenced_locally
	let form = $state<SlotForm>(data ? { ...data } : emptySlot());

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!slotId) {
			notification.error('Missing slot id');
			return;
		}

		try {
			await updateScheduleSlot({ slotId, ...form });
			notification.success('Schedule slot updated successfully');
			modalUtils.closeModal(id);
			await invalidateAll();
		} catch (err) {
			notification.error(errorMessage(err, 'Failed to update schedule slot'));
		}
	}
</script>

<dialog class="modal" {id}>
	<div class="modal-box bg-base-200 container">
		<form onsubmit={handleSubmit} class="space-y-4">
			<!-- Header -->
			<div class="flex items-center justify-between">
				<h2 class="text-2xl font-bold">Edit Schedule Slot</h2>
				<button
					type="button"
					class="btn btn-ghost btn-circle btn-sm"
					onclick={() => modalUtils.closeModal(id)}
				>
					<X class="size-4" />
				</button>
			</div>

			<!-- Locked -->
			<div class="card bg-base-300/50 border-base-content/10 border">
				<div class="card-body p-2">
					<div class="mb-1 flex items-center gap-2">
						<Lock class="text-base-content/50 size-4" />
						<h3 class="text-base-content/70 text-sm font-semibold">Locked Properties</h3>
					</div>
					<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
						<div class="bg-base-200/50 flex flex-col gap-1 rounded p-2">
							<span class="text-base-content/60 text-xs">Type</span>
							<span class="font-medium capitalize">{slotType || 'Not set'}</span>
						</div>
						{#if slotType === 'anime'}
							<div class="bg-base-200/50 flex flex-col gap-1 rounded p-2">
								<span class="text-base-content/60 text-xs">Anime</span>
								<span class="font-medium">{anime.animeTitle || 'Not set'}</span>
							</div>
						{/if}
					</div>
					<div class="text-base-content/50 mt-1 flex items-center gap-1 text-xs">
						<Info class="size-4" />
						<span>These properties cannot be changed after creation</span>
					</div>
				</div>
			</div>

			<!-- Basic -->
			<div class="card bg-base-300">
				<div class="card-body p-4">
					<h3 class="mb-2 font-bold">Basic Information</h3>
					<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
						<label class="select w-full">
							<span class="label">Day of Week</span>
							<select bind:value={form.dayOfWeek}>
								<option value={0}>Monday</option>
								<option value={1}>Tuesday</option>
								<option value={2}>Wednesday</option>
								<option value={3}>Thursday</option>
								<option value={4}>Friday</option>
								<option value={5}>Saturday</option>
								<option value={6}>Sunday</option>
							</select>
						</label>
						<label class="input w-full">
							<span class="label">Time</span>
							<input
								type="time"
								bind:value={() => form.time ?? '', (v) => (form.time = v === '' ? null : v)}
							/>
						</label>
					</div>
				</div>
			</div>

			<!-- Content -->
			<div class="card bg-base-300">
				<div class="card-body p-4">
					<h3 class="mb-2 font-bold">Content Details</h3>
					<div class="grid grid-cols-1 gap-2">
						<label class="input w-full">
							<span class="label">Title {slotType === 'misc' ? '' : '(Override)'}</span>
							<input
								type="text"
								bind:value={() => form.title ?? '', (v) => (form.title = v === '' ? null : v)}
								placeholder={slotType === 'anime' ? 'Override anime title' : 'Content title'}
							/>
						</label>
						<label class="input w-full">
							<span class="label">Description</span>
							<input
								class="w-full"
								bind:value={
									() => form.description ?? '', (v) => (form.description = v === '' ? null : v)
								}
								placeholder="Brief description"
							/>
						</label>
						<label class="input w-full">
							<span class="label">Logo URL</span>
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

			<!-- Options -->
			<div class="card bg-base-300">
				<div class="card-body p-4">
					<h3 class="mb-2 font-bold">Additional Options</h3>
					<div class="grid grid-cols-1 gap-2 md:grid-cols-2">
						<label class="input w-full">
							<span class="label">Episode Count</span>
							<input
								type="number"
								min="1"
								bind:value={
									() => form.episodeCount ?? '',
									(v) => (form.episodeCount = v === '' ? null : Number(v))
								}
								placeholder="Episodes per slot"
							/>
						</label>
						<label class="input w-full">
							<span class="label">Cancelled Text</span>
							<input
								type="text"
								bind:value={
									() => form.cancelledText ?? '', (v) => (form.cancelledText = v === '' ? null : v)
								}
								placeholder="Default cancellation message"
							/>
						</label>
					</div>
					<label class="input w-full">
						<span class="label">Note</span>
						<input
							type="text"
							class="w-full"
							bind:value={() => form.note ?? '', (v) => (form.note = v === '' ? null : v)}
							placeholder="Internal notes"
						/>
					</label>
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
								class="badge badge-lg transition-colors {isSelected
									? 'badge-primary'
									: 'badge-ghost'}"
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
					Save Changes
				</button>
				<button type="button" class="btn btn-error" onclick={() => modalUtils.closeModal(id)}>
					Cancel
				</button>
			</div>
		</form>
	</div>
</dialog>
