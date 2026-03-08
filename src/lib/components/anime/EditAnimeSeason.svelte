<script lang="ts">
	import { notification } from '$lib/components/ui/toaster';
	import { modalUtils } from '$lib/components/util';
	import { invalidateAll } from '$app/navigation';
	import { Book, Save } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { EditSeasonFormSchema, seasonEnum, formatEnum } from '$lib/schemas';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';

  type PrefillData = Partial<Omit<Infer<typeof EditSeasonFormSchema>, 'adnimeSeasonId'>> & Required<Pick<Infer<typeof EditSeasonFormSchema>, 'animeSeasonId'>>;

	interface Props {
		id: string;
		sForm: SuperValidated<Infer<typeof EditSeasonFormSchema>>;
    prefill?: PrefillData;
		action: string;
	}

	let { id, sForm, prefill, action }: Props = $props();

	// svelte-ignore state_referenced_locally
		let { form, enhance, errors } = superForm(sForm, {
		dataType: 'json',
		validators: zod4Client(EditSeasonFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				notification.success('Season updated successfully');
				modalUtils.closeModal(id);
				invalidateAll();
			} else if (result.type === 'error' || result.type === 'failure') {
				notification.error('Failed to update season');
			}
		}
	});

  $effect(() => {
    if (!prefill) return;

    $form.animeSeasonId = prefill.animeSeasonId;
    $form.sequence = prefill.sequence || 1;
    $form.format = prefill.format || formatEnum.options[0];
    $form.titleNative = prefill.titleNative || '';
    $form.titleRomaji = prefill.titleRomaji || null;
    $form.titleEnglish = prefill.titleEnglish || null;
    $form.shortTitle = prefill.shortTitle || null;
    $form.season = prefill.season || null;
    $form.year = prefill.year || null;
    $form.episodes = prefill.episodes || null;
    $form.episodeProgress = prefill.episodeProgress || null;
    $form.anilistId = prefill.anilistId || null;
    $form.malId = prefill.malId || null;
    $form.note = prefill.note || null;
  });
</script>

<dialog class="modal" {id}>
	<div class="modal-box w-11/12 max-w-3xl">
		<h3 class="font-bold text-xl mb-4">Edit Season</h3>

		<form method="POST" {action} use:enhance class="space-y-4">
			<fieldset class="fieldset bg-base-200 rounded-box p-4">
				<legend class="fieldset-legend">
					<Book class="h-4 w-4" />
					Season Details
				</legend>

				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<label class="input w-full">
						<span class="label">Sequence</span>
						<input
							type="number"
							bind:value={$form.sequence}
							placeholder="Season number (e.g., 1)"
							min={1}
						/>
					</label>
					{#if $errors.sequence}
						<p class="text-error text-xs">{$errors.sequence}</p>
					{/if}

					<label class="select w-full">
						<span class="label">Format <span class="text-error">*</span></span>
						<select bind:value={$form.format}>
							{#each formatEnum.options as format}
								<option value={format}>{format}</option>
							{/each}
						</select>
					</label>

					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">Title (Native) <span class="text-error">*</span></span>
							<input
								type="text"
								bind:value={$form.titleNative}
								placeholder="Original title in native language"
							/>
						</label>
						{#if $errors.titleNative}
							<p class="text-error text-xs mt-1">{$errors.titleNative}</p>
						{/if}
					</div>

					<label class="input w-full">
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

					<label class="input w-full">
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

					<label class="input w-full">
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

					<label class="select w-full">
						<span class="label">Season</span>
						<select bind:value={$form.season}>
							<option value={null}>N/A</option>
							{#each seasonEnum.options as s}
								<option value={s}>{s}</option>
							{/each}
						</select>
					</label>

					<label class="input w-full">
						<span class="label">Year</span>
						<input
							type="number"
							bind:value={
								() => $form.year || '',
								(v) => ($form.year = v === '' ? null : Number(v))
							}
							min={1900}
							max={2100}
							placeholder="Release year"
						/>
					</label>

					<label class="input w-full">
						<span class="label">Episodes</span>
						<input
							type="number"
							bind:value={
								() => $form.episodes || '',
								(v) => ($form.episodes = v === '' ? null : Number(v))
							}
							min={1}
							placeholder="Total episode count"
						/>
					</label>

					<label class="input w-full col-span-2">
						<span class="label">Episode Progress</span>
						<input
							type="number"
							bind:value={
								() => $form.episodeProgress || '',
								(v) => ($form.episodeProgress = v === '' ? null : Number(v))
							}
							min={1}
							placeholder="Episode progress"
						/>
					</label>

					<!-- Metadata -->
					<div class="md:col-span-2">
						<div class="divider my-1">Metadata</div>
					</div>

					<label class="input w-full">
						<span class="label">AniList ID</span>
						<input
							type="number"
							bind:value={
								() => $form.anilistId || '',
								(v) => ($form.anilistId = v === '' ? null : Number(v))
							}
							placeholder="AniList media ID"
							min={1}
						/>
					</label>

					<label class="input w-full">
						<span class="label">MAL ID</span>
						<input
							type="number"
							bind:value={
								() => $form.malId || '',
								(v) => ($form.malId = v === '' ? null : Number(v))
							}
							placeholder="MyAnimeList ID"
							min={1}
						/>
					</label>

					<div class="md:col-span-2">
						<label class="input w-full">
							<span class="label">Note (Optional)</span>
							<input
								type="text"
								bind:value={
									() => $form.note || '',
									(v) => ($form.note = v === '' ? null : v)
								}
								placeholder="Additional information"
							/>
						</label>
					</div>
				</div>
			</fieldset>

			<div class="modal-action">
				<button type="button" class="btn" onclick={() => modalUtils.closeModal(id)}>Cancel</button>
				<button type="submit" class="btn btn-primary">
					<Save class="h-4 w-4" />
					Save Changes
				</button>
			</div>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
