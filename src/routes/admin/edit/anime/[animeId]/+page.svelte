<script lang="ts">
	import { toast } from '$lib/components/ui/toaster';
	import _ from 'lodash';
	import { Minus, Pencil, Plus, X } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { formSchema, deleteFormSchema } from './util';
	import { confirm } from '$lib/util';

	let { data }: PageProps = $props();
	let seasonsTable = $derived(
		data.allSeasons.map((s) =>
			_.pick(s, ['animeId', 'sequence', 'titleNative', 'titleRomaji', 'titleEnglish'])
		)
	);

	const { form, enhance, errors } = superForm(data.form, {
		dataType: 'json',
		validators: zod(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		invalidateAll: 'force',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime updated successfully');
			} else if (result.type === 'error' || result.type === 'failure') {
				toast.error('Failed to update anime');
			}
		}
	});

	const {
		form: deleteForm,
		enhance: deleteEnhance,
		errors: deleteErrors,
		submit: deleteSubmit
	} = superForm(data.deleteForm, {
		dataType: 'json',
		validators: zod(deleteFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		invalidateAll: 'force',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime deleted successfully');
			} else if (result.type === 'failure') {
				toast.error(result.data?.text ?? 'Failed to delete anime');
			} else if (result.type === 'error') {
				toast.error('Failed to delete anime');
			}
		}
	});
</script>

<svelte:head>
	<title>
		Admin | Edit anime - {data.anime.titleEnglish ||
			data.anime.titleRomaji ||
			data.anime.titleNative} | G.O.T Archive
	</title>
</svelte:head>

<div class="flex w-full flex-col items-center justify-center gap-2">
	<form use:deleteEnhance action="?/delete" method="POST" id="delete-form" class="hidden">
		<input type="hidden" name="animeId" bind:value={$deleteForm.animeId} />
		<input type="hidden" name="sequence" bind:value={$deleteForm.sequence} />
	</form>
	{#if data.anime !== undefined}
		<form
			action="?/update"
			id="edit-form"
			method="POST"
			class="flex w-full max-w-5xl flex-col gap-2"
			use:enhance
		>
			<fieldset class="fieldset bg-base-300 rounded-box p-2">
				<legend class="fieldset-legend">Edit</legend>
				<label class="input w-full">
					<span class="label">Title native</span>
					<input type="text" bind:value={$form.anime.titleNative} />
				</label>
				<label class="input w-full">
					<span class="label">Title romaji</span>
					<input
						type="text"
						bind:value={
							() => $form.anime.titleRomaji || '',
							(v) => ($form.anime.titleRomaji = v === '' ? null : v)
						}
					/>
				</label>
				<label class="input w-full">
					<span class="label">Title english</span>
					<input
						type="text"
						bind:value={
							() => $form.anime.titleEnglish || '',
							(v) => ($form.anime.titleEnglish = v === '' ? null : v)
						}
					/>
				</label>
				<label class="select w-full">
					<span class="label">Genres</span>
					<select
						onchange={(e) => {
							const add = data.allGenres.find(
								(g) =>
									_.lowerCase(_.deburr(g.name)) === _.lowerCase(_.deburr(e.currentTarget.value))
							);
							if (!add) return;
							$form.genres = [...$form.genres, add];
							e.currentTarget.value = '';
						}}
					>
						<option value={''} selected disabled>Select genre</option>
						{#each _.differenceBy( data.allGenres, $form.genres, (g) => _.lowerCase(_.deburr(g.name)) ) as genre}
							<option value={genre.name}>{genre.name}</option>
						{/each}
					</select>
				</label>
				<div class="input w-full overflow-scroll">
					{#each $form.genres as genre}
						<button
							class="btn btn-neutral btn-xs"
							type="button"
							onclick={() =>
								($form.genres = $form.genres.filter(
									(g) => _.lowerCase(_.deburr(g.name)) !== _.lowerCase(_.deburr(genre.name))
								))}
						>
							{genre.name}
						</button>
					{/each}
				</div>
			</fieldset>
			<fieldset class="fieldset bg-base-300 rounded-box p-2">
				<legend class="fieldset-legend">Playlist links</legend>
				<div class="flex flex-col gap-2">
					{#each $form.links as link, index}
						<label class="floating-label">
							<span>Playlist url</span>
							<input
								class="input w-full"
								placeholder="Playlist url"
								type="text"
								bind:value={$form.links[index].url}
							/>
						</label>
						<label class="floating-label">
							<span>Platform</span>
							<select class="select w-full" bind:value={$form.links[index].platformId}>
								{#each data.allPlatforms as platform}
									<option value={platform.platformId}>
										{platform.name}
									</option>
								{/each}
							</select>
						</label>
						<label class="floating-label">
							<span>Note</span>
							<input
								class="input w-full"
								placeholder="Note"
								type="text"
								bind:value={
									() => $form.links[index].note ?? '',
									(v) => ($form.links[index].note = v === '' ? null : v)
								}
							/>
						</label>
						<div class="divider m-0 last:hidden"></div>
					{/each}
				</div>
				<div class="grid grid-cols-2 gap-1">
					<button
						class="btn btn-success"
						onclick={(e) => {
							e.preventDefault();
							$form.links = [...$form.links, { url: '', platformId: -1, note: '' }];
						}}
					>
						<Plus />
					</button>
					<button
						type="button"
						class="btn btn-error"
						onclick={(e) => {
							e.preventDefault();
							$form.links = $form.links.slice(0, -1);
						}}
					>
						<Minus />
					</button>
				</div>
			</fieldset>
			<button class="btn btn-success" type="submit">Edit</button>
		</form>

		<div class="border-base-content/5 rounded-box w-full max-w-5xl overflow-x-auto border">
			<table class="table">
				<thead>
					<tr class="uppercase">
						{#each _.keys(_.head(seasonsTable)) as header}
							<th>{_.lowerCase(header)}</th>
						{/each}
						<th>actions</th>
					</tr>
				</thead>
				<tbody>
					{#each seasonsTable as season}
						<tr>
							{#each _.values(season) as cell}
								<td>{cell}</td>
							{/each}
							<td class="flex flex-nowrap gap-2">
								<a
									href={`/admin/edit/anime/${season.animeId}/${season.sequence}`}
									class="btn btn-warning"
								>
									<Pencil />
								</a>
								<button
									class="btn btn-error"
									onclick={() => {
										confirm(() => {
											$deleteForm.animeId = season.animeId;
											$deleteForm.sequence = season.sequence;
											deleteSubmit();
										}, 'Are you sure you want to delete this season? This action cannot be undone.');
									}}
								>
									<X />
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>
