<script lang="ts">
	import { Clock, Edit, Power, PowerOff, Copy, Trash } from 'lucide-svelte';
	import { entryTypeColor } from '$lib/schemas';
	import type { EntryType } from '$lib/schemas';

	/** A slot row as returned by `+page.server.ts` (slot + joined anime + platform names). */
	export interface SlotRow {
		slot: {
			scheduleSlotId: string;
			dayOfWeek: number;
			time: string | null;
			type: EntryType | null;
			animeId: string | null;
			title: string | null;
			description: string | null;
			logoUrl: string | null;
			episodeCount: number | null;
			cancelledText: string | null;
			note: string | null;
			isActive: boolean;
		};
		anime: {
			titleEnglish: string | null;
			titleRomaji: string | null;
			titleNative: string;
			shortTitle: string | null;
		} | null;
		platforms: Array<string | null> | null;
	}

	interface Props {
		slotData: SlotRow;
		/** Active slots are full-opacity and can be deactivated; inactive are dimmed and deletable. */
		active: boolean;
		/** Optional day-name badge (shown for inactive slots). */
		dayName?: string;
		formatTime: (time: string | null) => string;
		onToggle: (slotId: string, isActive: boolean) => void;
		onEdit: (slotData: SlotRow) => void;
		onDuplicate: (slotData: SlotRow) => void;
		onDelete?: (slotId: string) => void;
	}

	let { slotData, active, dayName, formatTime, onToggle, onEdit, onDuplicate, onDelete }: Props =
		$props();

	const slot = $derived(slotData.slot);
	const animeData = $derived(slotData.anime);
</script>

<div
	class={[
		'card',
		active ? 'bg-base-300 hover:bg-base-100 transition-colors' : 'bg-base-300/50 opacity-60'
	]}
>
	<div class="card-body p-4">
		<div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
			<!-- Info -->
			<div class="flex-1">
				<div class="mb-2 flex flex-wrap items-center gap-2">
					{#if dayName}
						<span class="badge badge-sm">{dayName}</span>
					{/if}
					<div class="flex items-center gap-2">
						<Clock class="size-4" />
						<span class="font-semibold">{formatTime(slot.time)}</span>
					</div>

					{#if slot.type}
						<div
							class="badge badge-sm"
							style="background-color: {entryTypeColor(slot.type)}; color: white;"
						>
							{slot.type}
						</div>
					{/if}
				</div>

				<!-- Title -->
				<p class="font-medium">
					{#if animeData}
						{animeData.titleEnglish || animeData.titleRomaji || animeData.titleNative}
						{#if active && animeData.shortTitle}
							<span class="text-base-content/60 text-sm">({animeData.shortTitle})</span>
						{/if}
					{:else if slot.title}
						{slot.title}
					{:else}
						<span class="text-base-content/60 italic">No title set</span>
					{/if}
				</p>

				{#if active && slot.description}
					<p class="text-base-content/70 mt-1 text-sm">{slot.description}</p>
				{/if}

				{#if active}
					<!-- Extra -->
					<div class="mt-2 flex flex-wrap gap-2">
						{#if slot.episodeCount}
							<div class="badge badge-outline badge-sm">
								{slot.episodeCount} ep{slot.episodeCount > 1 ? 's' : ''}
							</div>
						{/if}
						{#if slotData.platforms && slotData.platforms.length > 0}
							{#each slotData.platforms as platform}
								{#if platform}
									<div class="badge badge-primary badge-sm">{platform}</div>
								{/if}
							{/each}
						{/if}
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					class="btn btn-ghost btn-sm btn-square"
					title={active ? 'Deactivate' : 'Activate'}
					onclick={() => onToggle(slot.scheduleSlotId, slot.isActive)}
				>
					{#if active}
						<Power class="text-success size-4" />
					{:else}
						<PowerOff class="text-error size-4" />
					{/if}
				</button>
				<button
					class="btn btn-ghost btn-sm btn-square"
					title="Edit"
					onclick={() => onEdit(slotData)}
				>
					<Edit class="size-4" />
				</button>
				<button
					class="btn btn-ghost btn-sm btn-square"
					title="Duplicate"
					onclick={() => onDuplicate(slotData)}
				>
					<Copy class="size-4" />
				</button>
				{#if !active && onDelete}
					<button
						type="button"
						class="btn btn-ghost btn-sm btn-square"
						title="Delete"
						onclick={() => onDelete(slot.scheduleSlotId)}
					>
						<Trash class="text-error size-4" />
					</button>
				{/if}
			</div>
		</div>
	</div>
</div>
