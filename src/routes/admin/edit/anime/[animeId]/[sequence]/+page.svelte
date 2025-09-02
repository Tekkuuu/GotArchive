<script lang="ts">
	import { LucideIcon } from '$lib/components/util/';
	import { toast } from '$lib/components/ui/toaster';
	import _ from 'lodash';
	import { MoveLeft, MoveRight } from 'lucide-svelte';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { superForm } from 'sveltekit-superforms/client';
	import type { PageProps } from './$types';
	import { formSchema, updateEpisodesFormSchema } from './util';

	let { data }: PageProps = $props();

	const { form, enhance, errors } = superForm(data.form, {
		dataType: 'json',
		validators: zod4Client(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		invalidateAll: 'force',
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime updated successfully');
			} else if (result.type === 'error' || result.type === 'failure') {
				toast.error('Failed to update anime');
			}
		}
	});

	const {
		form: updateEpisodesForm,
		enhance: updateEpisodesEnhance,
		errors: updateEpisodesErrors
	} = superForm(data.updateEpisodesForm, {
		dataType: 'json',
		validators: zod4Client(updateEpisodesFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		invalidateAll: 'force',
		resetForm: true,
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime updated successfully');
			} else if (result.type === 'error' || result.type === 'failure') {
				toast.error('Failed to update anime');
			}
		}
	});
</script>

<svelte:head>
	<title>
		Admin | Edit anime season - {data.season.titleEnglish ||
			data.season.titleRomaji ||
			data.season.titleNative} | G.O.T Archive
	</title>
</svelte:head>

<div class="flex w-full flex-col items-center justify-center gap-2">
	{#if data.season !== undefined}
		<form
			action="?/update"
			id="edit-form"
			method="POST"
			class="flex w-full max-w-5xl flex-col gap-2"
			use:enhance
		>
			<fieldset class="fieldset rounded-box bg-base-300 p-2">
				<legend class="fieldset-legend">Edit Anime Season</legend>
				<label class="input bg-base-100! w-full">
					<span class="label">Sequence</span>
					<input type="text" bind:value={$form.sequence} disabled />
				</label>
				<label class="input w-full">
					<span class="label">Title native</span>
					<input type="text" bind:value={$form.titleNative} />
				</label>
				<label class="input w-full">
					<span class="label">Title romaji</span>
					<input
						type="text"
						bind:value={
							() => $form.titleRomaji || '', (v) => ($form.titleRomaji = v === '' ? null : v)
						}
					/>
				</label>
				<label class="input w-full">
					<span class="label">Title english</span>
					<input
						type="text"
						bind:value={
							() => $form.titleEnglish || '', (v) => ($form.titleEnglish = v === '' ? null : v)
						}
					/>
				</label>
				<label class="select w-full">
					<span class="label">Format</span>
					<select bind:value={$form.format}>
						{#each data.formats as format}
							<option value={format}>{format}</option>
						{/each}
					</select>
				</label>
				<label class="select w-full">
					<span class="label">Season</span>
					<select
						bind:value={() => $form.season || '', (v) => ($form.season = v === '' ? null : v)}
					>
						<option value="">N/A</option>
						{#each data.seasons as season}
							<option value={season}>{season}</option>
						{/each}
					</select>
				</label>
				<label class="input w-full">
					<span class="label">Year</span>
					<input
						type="number"
						bind:value={() => $form.year || '', (v) => ($form.year = v === '' ? null : v)}
					/>
				</label>
				<label class="input bg-base-100! w-full">
					<span class="label">Episodes</span>
					<input type="number" bind:value={$form.episodes} disabled />
				</label>
				<label class="input w-full">
					<span class="label">Anilist URL</span>
					<input type="text" bind:value={$form.anilistLink} />
				</label>
			</fieldset>
			<button class="btn btn-warning" type="submit" form="edit-form">Edit</button>
			{#key data.previous || data.next}
				<div class="flex gap-2">
					<a
						class={['btn btn-info grow', !data.previous && 'btn-outline pointer-events-none']}
						href={data.previous === undefined
							? '#'
							: `/admin/edit/anime/${data.animeId}/${data.previous}`}
					>
						<LucideIcon icon={MoveLeft} />
					</a>
					<a
						class={['btn btn-info grow', !data.next && 'btn-outline pointer-events-none']}
						href={data.next === undefined ? '#' : `/admin/edit/anime/${data.animeId}/${data.next}`}
					>
						<LucideIcon icon={MoveRight} />
					</a>
				</div>
			{/key}
		</form>
		<div class="flex w-full max-w-5xl flex-col">
			<form
				action="?/updateEpisodes"
				id="update-episodes-form"
				method="POST"
				class="flex flex-col gap-2"
				use:updateEpisodesEnhance
			>
				<fieldset
					class="fieldset rounded-box bg-base-300 grid grid-cols-3 gap-2 p-2 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12"
				>
					<legend class="fieldset-legend">Update Episodes Watched</legend>
					{#each $updateEpisodesForm.episodes as episode}
						<input type="hidden" name="animeEpisodeId" bind:value={episode.animeEpisodeId} />
						<label class="btn has-checked:btn-success w-full">
							<input class="hidden" type="checkbox" bind:checked={episode.watched} />
							{episode.episodeNumber}
						</label>
					{/each}
				</fieldset>
				<button type="submit" class="btn btn-warning">Update Episodes</button>
			</form>
		</div>
	{/if}
</div>
