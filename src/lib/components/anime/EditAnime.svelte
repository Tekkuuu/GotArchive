<script lang="ts">
	import { notification } from '$lib/components/ui/toaster';
	import { modalUtils } from '$lib/components/util';
	import { invalidateAll } from '$app/navigation';
	import { Book, Link2 } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { AnimeUpdateFormSchema } from '$lib/schemas';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';

	interface Platform {
		platformId: string;
		name: string;
	}

	interface Props {
		id: string;
		sForm: SuperValidated<Infer<typeof AnimeUpdateFormSchema>>;
		platforms: Platform[];
		action: string;
    prefill?: Partial<Infer<typeof AnimeUpdateFormSchema>>;
	}

	let { id, sForm, prefill, platforms, action }: Props = $props();

	// svelte-ignore state_referenced_locally
		let { form, enhance, errors } = superForm(sForm, {
		dataType: 'json',
		validators: zod4Client(AnimeUpdateFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				notification.success('Anime updated successfully');
				modalUtils.closeModal(id);
				invalidateAll();
			} else if (result.type === 'error' || result.type === 'failure') {
				notification.error('Failed to update anime');
			}
		}
	});

  $effect(() => {
    $form.titleNative = prefill?.titleNative ?? null;
    $form.titleRomaji = prefill?.titleRomaji ?? null;
    $form.titleEnglish = prefill?.titleEnglish ?? null;
    $form.shortTitle = prefill?.shortTitle ?? null;
    $form.logoUrl = prefill?.logoUrl ?? null;
    $form.links = prefill?.links?.map(link => ({
      url: link.url,
      platformId: link.platformId,
      note: link.note ?? null
    })) ?? [];
    $form.genres = prefill?.genres ?? [];
  });
</script>

<dialog class="modal" {id}>
	<div class="modal-box w-11/12 max-w-2xl">
		<h3 class="font-bold text-xl mb-4">Edit Anime</h3>

		<form method="POST" {action} use:enhance class="space-y-4">
			<!-- Titles -->
			<fieldset class="fieldset bg-base-200 rounded-box p-4">
				<legend class="fieldset-legend">
					<Book class="size-4" />
					Anime details
				</legend>

				<label class="input w-full">
					<span class="label">Title (Native)</span>
					<input
						type="text"
						bind:value={
							() => $form.titleNative || '',
							(v) => ($form.titleNative = v === '' ? null : v)
						}
						placeholder="Original title"
					/>
				</label>
				{#if $errors.titleNative}
					<p class="text-error text-xs mt-1">{$errors.titleNative}</p>
				{/if}

				<label class="input w-full mt-2">
					<span class="label">Title (Romaji)</span>
					<input
						type="text"
						bind:value={
							() => $form.titleRomaji || '',
							(v) => ($form.titleRomaji = v === '' ? null : v)
						}
						placeholder="Romanized title"
					/>
				</label>

				<label class="input w-full mt-2">
					<span class="label">Title (English)</span>
					<input
						type="text"
						bind:value={
							() => $form.titleEnglish || '',
							(v) => ($form.titleEnglish = v === '' ? null : v)
						}
						placeholder="English title"
					/>
				</label>

				<label class="input w-full mt-2">
					<span class="label">Short Title</span>
					<input
						type="text"
						bind:value={
							() => $form.shortTitle || '',
							(v) => ($form.shortTitle = v === '' ? null : v)
						}
						placeholder="Abbreviated title"
					/>
				</label>

				<label class="input w-full mt-2">
					<span class="label">Logo URL</span>
					<input
						type="text"
						bind:value={
							() => $form.logoUrl || '',
							(v) => ($form.logoUrl = v === '' ? null : v)
						}
						placeholder="https://example.com/logo.png"
					/>
				</label>
			</fieldset>

      <fieldset class="fieldset bg-base-200 rounded-box p-4">
        <legend class="fieldset-legend">
          <Link2 class="size-4" />
          Playlists
        </legend>
        <div class="flex flex-col gap-2">
          {#each { length: $form.links.length }, i}
            <label class="input w-full">
              <span class="label">Playlist URL</span>
              <input
                type="text"
                bind:value={$form.links[i].url}
              />
            </label>
            <label class="select w-full">
              <span class="label">Platform</span>
              <select bind:value={$form.links[i].platformId}>
                {#each platforms as platform}
                  <option value={platform.platformId}>{platform.name}</option>
                {/each}
              </select>
            </label>
            <label class="input w-full">
              <span class="label">Note</span>
              <input
                type="text"
                bind:value={
                  () => $form.links[i].note || '',
                  (v) => ($form.links[i].note = v === '' ? null : v)
                }
              />
            </label>
            <div class="last:hidden divider m-0"></div>
          {/each}
        </div>
      </fieldset>

			<div class="modal-action">
				<button type="button" class="btn" onclick={() => modalUtils.closeModal(id)}>Cancel</button>
				<button type="submit" class="btn btn-primary">Save Changes</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
