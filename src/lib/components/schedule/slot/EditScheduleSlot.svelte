<script lang="ts">
  import { EditScheduleSlotSchema } from './util';
  import type { SuperValidated, Infer } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import type { Platform } from '$lib/server/db';
	import { Info, Save, X, Lock } from 'lucide-svelte';
	import { sineInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
  import { modalUtils } from '$lib/components/util';
  import { notification } from '$lib/components/ui/toaster';
  import { invalidateAll } from '$app/navigation';

  interface Props {
    id: string;
    sForm: SuperValidated<Infer<typeof EditScheduleSlotSchema>>;
    action: string;
    data: Infer<typeof EditScheduleSlotSchema> | null;
    slotId: string | null;
    slotType: string | null;
    animeTitle: string | null;
    startingSeasonTitle: string | null;
    startingEpisode: number | null;
    platforms?: Platform[];
  }

  let { id, sForm, action, data, slotId, slotType, animeTitle, startingSeasonTitle, startingEpisode, platforms }: Props = $props();

  // svelte-ignore state_referenced_locally
  const { form, enhance } = superForm(sForm, {
		dataType: 'json',
		validators: zod4Client(EditScheduleSlotSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
    resetForm: false, // Don't reset form on success
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        notification.success('Schedule slot updated successfully');
        modalUtils.closeModal(id);
        await invalidateAll();
      } else if (result.type === 'failure') {
        notification.error(result.data?.error || 'Failed to update schedule slot');
      }
    }
  });

  // Update form when data changes (when modal opens with new slot data)
  $effect(() => {
    if (data) {
      $form = { ...data };
    }
  });

</script>

<dialog class="modal" {id}>
  <div class="modal-box max-w-4xl bg-base-200">
    <form use:enhance method="post" {action} class="space-y-4">
      <!-- Hidden slot ID -->
      <input type="hidden" name="slotId" value={slotId || ''} />

      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">Edit Schedule Slot</h2>
        <button type="button" class="btn btn-ghost btn-circle btn-sm" onclick={() => modalUtils.closeModal(id)}>
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Uneditable Data Display -->
      <div class="card bg-base-300/50 border border-base-content/10">
        <div class="card-body p-2">
          <div class="flex items-center gap-2 mb-1">
            <Lock class="h-4 w-4 text-base-content/50" />
            <h3 class="text-sm font-semibold text-base-content/70">Locked Properties</h3>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div class="flex flex-col gap-1 p-2 bg-base-200/50 rounded">
              <span class="text-xs text-base-content/60">Type</span>
              <span class="font-medium capitalize">{slotType || 'Not set'}</span>
            </div>
            {#if slotType === 'anime'}
              <div class="flex flex-col gap-1 p-2 bg-base-200/50 rounded">
                <span class="text-xs text-base-content/60">Anime</span>
                <span class="font-medium">{animeTitle || 'Not set'}</span>
              </div>
              {#if startingSeasonTitle !== null}
                <div class="flex flex-col gap-1 p-2 bg-base-200/50 rounded">
                  <span class="text-xs text-base-content/60">Starting Season</span>
                  <span class="font-medium">{startingSeasonTitle}</span>
                </div>
              {/if}
              {#if startingEpisode !== null}
                <div class="flex flex-col gap-1 p-2 bg-base-200/50 rounded">
                  <span class="text-xs text-base-content/60">Starting Episode</span>
                  <span class="font-medium">Episode {startingEpisode}</span>
                </div>
              {/if}
            {/if}
          </div>
          <div class="text-xs text-base-content/50 flex items-center gap-1 mt-1">
            <Info class="h-3 w-3" />
            <span>These properties cannot be changed after creation</span>
          </div>
        </div>
      </div>

      <!-- Basic Info Card -->
      <div class="card bg-base-300">
        <div class="card-body p-4">
          <h3 class="font-bold mb-2">Basic Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label class="select w-full">
              <span class="label">Day of Week</span>
              <select bind:value={$form.dayOfWeek}>
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
              <input type="time" bind:value={$form.time} />
            </label>
          </div>
        </div>
      </div>

      <!-- Content Details Card -->
      <div class="card bg-base-300">
        <div class="card-body p-4">
          <h3 class="font-bold mb-2">Content Details</h3>
          <div class="grid grid-cols-1 gap-2">
            <label class="input w-full">
              <span class="label">Title {slotType === 'misc' ? '' : '(Override)'}</span>
              <input
                type="text"
                bind:value={() => $form.title || '', (v) => ($form.title = v === '' ? null : v)}
                placeholder={slotType === 'anime' ? 'Override anime title' : 'Content title'}
              />
            </label>
            <label class="input w-full">
              <span class="label">Description</span>
              <input
                class="w-full"
                bind:value={() => $form.description || '', (v) => ($form.description = v === '' ? null : v)}
                placeholder="Brief description"
              />
            </label>
            <label class="input w-full">
              <span class="label">Logo URL</span>
              <input
                type="url"
                bind:value={() => $form.logoUrl || '', (v) => ($form.logoUrl = v === '' ? null : v)}
                placeholder="https://example.com/logo.png"
              />
            </label>
            {#if $form.logoUrl}
              <img src={$form.logoUrl} alt="Content logo" class="max-h-24 w-auto object-contain" transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}/>
            {/if}
          </div>
        </div>
      </div>

      <!-- Additional Options Card -->
      <div class="card bg-base-300">
        <div class="card-body p-4">
          <h3 class="font-bold mb-2">Additional Options</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
            <label class="input w-full">
              <span class="label">Episode Count</span>
              <input
                type="number"
                min="1"
                bind:value={() => $form.episodeCount || '', (v) => ($form.episodeCount = v === '' ? null : Number(v))}
                placeholder="Episodes per slot"
              />
            </label>
            <label class="input w-full">
              <span class="label">Cancelled Text</span>
              <input
                type="text"
                bind:value={() => $form.cancelledText || '', (v) => ($form.cancelledText = v === '' ? null : v)}
                placeholder="Default cancellation message"
              />
            </label>
          </div>
          <label class="input w-full">
            <span class="label">Note</span>
            <input
              type="text"
              class="w-full"
              bind:value={() => $form.note || '', (v) => ($form.note = v === '' ? null : v)}
              placeholder="Internal notes"
            />
          </label>
        </div>
      </div>

      <!-- Platforms Card -->
      <div class="card bg-base-300">
        <div class="card-body p-4">
          <h3 class="font-bold mb-2">Platforms</h3>
          <div class="flex flex-wrap gap-2">
            {#each platforms ?? [] as platform}
              {@const isSelected = $form.platforms.some(p => p.platformId === platform.platformId)}
              <button
                type="button"
                class="badge badge-lg transition-colors {isSelected ? 'badge-primary' : 'badge-ghost'}"
                onclick={() => {
                  if (isSelected) {
                    $form.platforms = $form.platforms.filter(p => p.platformId !== platform.platformId);
                  } else {
                    $form.platforms = [...$form.platforms, { platformId: platform.platformId }];
                  }
                }}
              >
                {platform.name}
              </button>
            {/each}
          </div>
          {#if (platforms ?? []).length === 0}
            <div class="text-sm text-base-content/60 flex items-center gap-2">
              <Info class="h-4 w-4" />
              <span>No platforms available</span>
            </div>
          {/if}
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-2">
        <button type="submit" class="btn btn-success flex-1">
          <Save class="h-4 w-4" />
          Save Changes
        </button>
        <button type="button" class="btn btn-error" onclick={() => modalUtils.closeModal(id)}>
          Cancel
        </button>
      </div>
    </form>
  </div>
</dialog>
