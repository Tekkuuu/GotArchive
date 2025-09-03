<script lang="ts">
	import { anilistServices as s } from '$lib/anilist';
	import { AppError } from '$lib/errors';
	import { toast } from '$lib/components/ui/toaster';
	import _ from 'lodash';
	import { Minus, Plus } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { formSchema } from './util';

	let { data }: PageProps = $props();
	let { form, enhance, errors } = superForm(data.form, {
		dataType: 'json',
		validators: zod4(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime create successfully');
			} else if (result.type === 'error' || result.type === 'failure') {
				toast.error('Failed to create anime');
			}
		}
	});

	let anilistId: number = $state(0);

	async function fillForm(anilistId: number) {
		try {
			const response = await s.fetchAnime(anilistId);

			// Fill form
			$form.titleNative = response.title.native;
			$form.titleRomaji = response.title.romaji;
			$form.titleEnglish = response.title.english;

			const existingGenreNames = new Set(data.genres.map((genre) => genre.name));

			const newGenres = response.genres
				.filter((genre) => !existingGenreNames.has(genre)) // Filter out genres already present
				.map((genre) => ({
					genreId: -1,
					name: genre
				}));

			// Merge new genres into the existing data
			data.genres = [...data.genres, ...newGenres];

			$form.genres = data.genres.filter((x) => response.genres.find((g) => g === x.name));

			toast.success('Anime data fetched successfully', 1000);
		} catch (e: any) {
			if (e instanceof AppError) {
				toast.error(e.message, 5000);
			} else if (e instanceof Error) {
				// Fallback for unexpected errors
				toast.error(e.message, 5000);
			} else {
				toast.error('An unexpected error occurred while fetching anime details.', 5000);
			}
			return;
		}
	}

	$inspect($errors.titleNative);
</script>

<svelte:head>
	<title>Admin | New anime | G.O.T Archive</title>
</svelte:head>

<div class="flex w-full flex-col items-center justify-center gap-2">
	<div class="grid w-full grid-cols-1 gap-2">
		<label class="input w-full">
			<span class="label">AnimeID</span>
			<input type="number" required min={1} bind:value={anilistId} />
		</label>
		<button
			class="btn btn-success"
			onclick={() => {
				fillForm(anilistId);
			}}
		>
			Get
		</button>
	</div>
	<form
		method="POST"
		action="?/create"
		class="flex w-full flex-col gap-2"
		id="form-new-anime"
		use:enhance
	>
		<fieldset class="fieldset bg-base-300 rounded-box p-2">
			<legend class="fieldset-legend">Anime details</legend>
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
			<label class="input w-full">
				<span class="label">Short title</span>
				<input
					type="text"
					bind:value={() => $form.shortTitle || '', (v) => ($form.shortTitle = v === '' ? null : v)}
				/>
			</label>
			<label class="input w-full">
				<span class="label">Logo url</span>
				<input
					type="text"
					bind:value={() => $form.logoUrl || '', (v) => ($form.logoUrl = v === '' ? null : v)}
				/>
			</label>
			<label class="select w-full">
				<span class="label">Genres</span>
				<select
					onchange={(e) => {
						const add = data.genres.find(
							(g) => _.lowerCase(_.deburr(g.name)) === _.lowerCase(_.deburr(e.currentTarget.value))
						);
						if (!add) return;
						$form.genres = [...$form.genres, add];
						e.currentTarget.value = '';
					}}
				>
					<option value={''} selected disabled>Select genre</option>
					{#each _.differenceBy( data.genres, $form.genres, (g) => _.lowerCase(_.deburr(g.name)) ) as genre}
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
		<fieldset class="fieldset bg-base-300 rounded-box gap-2 p-2">
			<legend class="fieldset-legend">Playlist links</legend>
			{#each $form.links as link, index}
				<div class="flex flex-col gap-2 md:flex-row">
					<label class="floating-label w-full">
						<span>URL</span>
						<input
							class="input w-full"
							type="text"
							bind:value={$form.links[index].url}
							placeholder="URL"
						/>
					</label>
					<label class="floating-label w-full">
						<span>Platform</span>
						<select class="select w-full" bind:value={$form.links[index].platformId}>
							<option value={-1} disabled selected>Select platform</option>
							{#each data.platforms as platform}
								<option value={platform.platformId}>{platform.name}</option>
							{/each}
						</select>
					</label>
					<label class="floating-label w-full">
						<span>Note</span>
						<input
							class="input w-full"
							type="text"
							bind:value={
								() => $form.links[index].note || '',
								(v) => ($form.links[index].note = v === '' ? null : v)
							}
							placeholder="Note"
						/>
					</label>
				</div>
			{/each}
			<div class="flex w-full gap-2">
				<button
					type="button"
					class="btn btn-success grow"
					onclick={() => ($form.links = [...$form.links, { url: '', platformId: -1, note: null }])}
				>
					<Plus />
				</button>
				<button
					type="button"
					class="btn btn-error grow"
					onclick={() => ($form.links = _.dropRight($form.links))}
				>
					<Minus />
				</button>
			</div>
		</fieldset>
		<button class="btn btn-success">
			<span class="font-bold">Submit</span>
		</button>
	</form>
</div>
