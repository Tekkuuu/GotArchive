<script lang="ts">
  import { AddScheduleSlotSchema, SCHEDULE_ENTRY_TYPES, WEEKDAYS } from './util';
  import type { SuperValidated, Infer } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms';
  import { zod4Client } from 'sveltekit-superforms/adapters';
  import type { Anime, AnimeSeason, Platform } from '$lib/server/db';
	import { Info, Power, PowerOff, Save, X } from 'lucide-svelte';
	import { sineInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
  import { modalUtils } from '$lib/components/util';
  import { toast } from '$lib/components/ui/toaster';
  import { invalidateAll } from '$app/navigation';

  interface Props {
    id: string;
    sForm: SuperValidated<Infer<typeof AddScheduleSlotSchema>>;
    data?: Infer<typeof AddScheduleSlotSchema> | null;
    action: string;
    availableAnime?: Anime[];
    availableSeasons?: AnimeSeason[];
    platforms?: Platform[];
  }

  let { id, sForm, data, action, availableAnime, availableSeasons, platforms }: Props = $props();

  // Local state for anime title input
  let animeInputValue = $state('');

  // svelte-ignore state_referenced_locally
  const { form, enhance } = superForm(sForm, {
		dataType: 'json',
		validators: zod4Client(AddScheduleSlotSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
    resetForm: false,
    onResult: async ({ result }) => {
      if (result.type === 'success') {
        toast.success('Schedule slot created successfully');
        modalUtils.closeModal(id);
        await invalidateAll();
      } else if (result.type === 'failure') {
        toast.error(result.data?.error || 'Failed to create schedule slot');
      }
    }
  });

  // Update form when data changes (when duplicating a slot)
  $effect(() => {
    if (data) {
      $form = { ...data };
      // Also set the anime input value if animeId is present
      if (data.animeId) {
        const anime = availableAnime?.find(a => a.animeId === data.animeId);
        animeInputValue = anime?.titleEnglish || '';
      } else {
        animeInputValue = '';
      }
    }
  });
</script>

<dialog class="modal" {id}>
  <div class="modal-box max-w-4xl bg-base-200">
    <form use:enhance method="post" {action} class="space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h2 class="text-2xl font-bold">Schedule Slot</h2>
        <button type="button" class="btn btn-ghost btn-circle btn-sm" onclick={() => modalUtils.closeModal(id)}>
          <X class="h-4 w-4" />
        </button>
      </div>

      <!-- Basic Info Card -->
      <div class="card bg-base-300">
        <div class="card-body p-4">
          <h3 class="font-bold mb-2">Basic Information</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <label class="select w-full">
              <span class="label">Day of Week</span>
              <select 
                bind:value={$form.dayOfWeek} 
                onchange={() => {
                  if($form.duplicateToDays.includes($form.dayOfWeek)) {
                    $form.duplicateToDays = $form.duplicateToDays.filter(day => day !== $form.dayOfWeek);
                  }
                }}>
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
            <label class="select w-full">
              <span class="label">Type</span>
              <select bind:value={$form.type}>
                {#each SCHEDULE_ENTRY_TYPES as type}
                  <option value={type.value}>{type.label}</option>
                {/each}
              </select>
            </label>
          </div>
        </div>
      </div>

      <!-- Anime-specific fields -->
      {#if $form.type === 'anime'}
        <div class="card bg-base-300" transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}>
          <div class="card-body p-4">
            <h3 class="font-bold mb-2">Anime Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                    $form.animeId = availableAnime?.find(
                      (anime) => anime.titleEnglish === (e.currentTarget.value)
                    )?.animeId || null;
                  }}
                />
              </label>
              <label class="select w-full">
                <span class="label">Season</span>
                <select
                  bind:value={
                    () => $form.animeSeasonId || '',
                    (v) => {
                      $form.animeSeasonId = v === '' ? null : v;
                      $form.startingSequence = availableSeasons?.find((season) => season.animeSeasonId === $form.animeSeasonId)?.sequence || null;
                    }
                  }
                  disabled={$form.animeId === null}
                >
                  {#each
                    availableSeasons?.filter((season) => season.animeId === $form.animeId) ?? []
                    as
                    season
                  }
                    <option value={season.animeSeasonId}>{season.titleEnglish}</option>
                  {/each}
                </select>
              </label>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
              <label class="input w-full">
                <span class="label">Starting Episode</span>
                <input
                  type="number"
                  min="1"
                  bind:value={() => $form.startingEpisode || '', (v) => ($form.startingEpisode = v === '' ? null : Number(v))}
                />
              </label>
              <label class="input w-full">
                <span class="label">Episode Count</span>
                <input
                  type="number"
                  min="1"
                  bind:value={() => $form.episodeCount || '', (v) => ($form.episodeCount = v === '' ? null : Number(v))}
                />
              </label>
            </div>

            {#if $form.animeId !== null}
              <div class="flex gap-2 bg-info/10 border border-dashed border-info p-2 rounded-box text-info items-center" transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}>
                <Info class="h-4 w-4 shrink-0" />
                <span>Selected:</span>
                <span class='font-bold'>{availableAnime?.find((anime) => anime.animeId === $form.animeId)?.titleEnglish}</span>
                <span>/</span>
                <span>{availableSeasons?.find((season) => season.animeSeasonId === $form.animeSeasonId)?.titleEnglish}</span>
              </div>
            {/if}

            <label class="input w-full">
              <span class="label">Title</span>
              <input
                type="text"
                bind:value={() => $form.title || '', (v) => ($form.title = v === '' ? null : v)}
                placeholder="Override"
              />
            </label>
            <label class="input w-full">
              <span class="label">Description</span>
              <input
                class="w-full"
                bind:value={() => $form.description || '', (v) => ($form.description = v === '' ? null : v)}
                placeholder="Override"
              />
            </label>
            <label class="input w-full">
              <span class="label">Logo URL</span>
              <input
                type="url"
                bind:value={() => $form.logoUrl || '', (v) => ($form.logoUrl = v === '' ? null : v)}
                placeholder="Override"
              />
            </label>
            {#if $form.logoUrl}
              <img src={$form.logoUrl} alt="Content logo" class="max-h-24 w-auto object-contain" transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}/>
            {/if}
          </div>
        </div>
      {:else if $form.type === 'misc'}
        <!-- Generic content fields (for non-anime types) -->
        <div class="card bg-base-300" transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}>
          <div class="card-body p-4">
            <h3 class="font-bold mb-2">Content Details</h3>
            <div class="grid grid-cols-1 gap-2">
              <label class="input w-full">
                <span class="label">Title <span class="text-error">*</span></span>
                <input
                  type="text"
                  bind:value={() => $form.title || '', (v) => ($form.title = v === '' ? null : v)}
                  placeholder="Content title"
                  required
                />
              </label>
              <label class="input w-full">
                <span class="label">Description (Optional)</span>
                <input
                  class="w-full"
                  bind:value={() => $form.description || '', (v) => ($form.description = v === '' ? null : v)}
                  placeholder="Brief description"
                />
              </label>
              <label class="input w-full">
                <span class="label">Logo URL (Optional)</span>
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
      {/if}

      <!-- Additional Options Card -->
      <div class="card bg-base-300">
        <div class="card-body p-4">
          <h3 class="font-bold mb-2">Additional Options</h3>
          <div class="grid grid-cols-1 gap-2">
            <label class="input w-full">
              <span class="label">Note</span>
              <input
                type="text"
                class="w-full"
                bind:value={() => $form.note || '', (v) => ($form.note = v === '' ? null : v)}
              />
            </label>
            <label class="input w-full">
              <span class="label">Cancelled Text</span>
              <input
                type="text"
                bind:value={() => $form.cancelledText || '', (v) => ($form.cancelledText = v === '' ? null : v)}
              />
            </label>
          </div>
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

      <div class="card bg-base-300">
        <div class="card-body p-4">
          <h3 class="font-bold mb-2">Duplicate</h3>
          <div class="grid grid-cols-1 md:grid-cols-7 gap-2">
            {#each WEEKDAYS as weekday}
              <button
                disabled={weekday.value === $form.dayOfWeek}
                type="button"
                class={[
                  'btn w-full',
                  weekday.value !== $form.dayOfWeek ? 'btn-success' : '',
                  ($form.duplicateToDays.includes(weekday.value) || weekday.value === $form.dayOfWeek) ? '' : 'bg-success/10! text-base-content'
                ]}
                onclick={() => {
                  if(!$form.duplicateToDays.includes(weekday.value)) {
                    $form.duplicateToDays = [...$form.duplicateToDays, weekday.value];
                  } else {
                    $form.duplicateToDays = $form.duplicateToDays.filter(day => day !== weekday.value);
                  }
                }}
              >
                {weekday.label}
              </button>
            {/each}
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex gap-2">
        <button type="submit" class="btn btn-success flex-1">
          <Save class="h-4 w-4" />
          Save Slot
        </button>
        <button type="button" class="btn btn-error" onclick={() => modalUtils.closeModal(id)}>
          Cancel
        </button>
        <label class="swap btn bg-success rounded-field transition-color duration-150 p-2" id="add-schedule-slot-active-toggle">
          <input
            type="checkbox"
            bind:checked={$form.isActive}
            onchange={() => {
              document.getElementById('add-schedule-slot-active-toggle')?.classList.toggle('bg-success', $form.isActive);
              document.getElementById('add-schedule-slot-active-toggle')?.classList.toggle('bg-error', !$form.isActive);
            }}
          />
          <Power class="swap-on text-base-200"/>
          <PowerOff class="swap-off text-base-200"/>
        </label>
      </div>
    </form>
  </div>
</dialog>
