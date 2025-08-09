<script lang="ts">
	import { anilistServices as s } from '$lib/anilist';
	import { AppError } from '$lib/errors';
	import { Button, Input, Label, Select, SectionTitle } from '$lib/components/forms';
	import { LucideIcon } from '$lib/components/util';
	import * as T from '$lib/components/table/';
	import { toast } from '$lib/components/ui/toaster';
	import _ from 'lodash';
	import { Check, CircleX, Hash, Minus, Plus, Tag, Text } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { formSchema } from './util';
	import { MediaQuery } from 'svelte/reactivity';

	let maxSm: MediaQuery = new MediaQuery('max-width: 39.999rem');

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

			toast.success('Anime data fetched successfully', Check, 1000);
		} catch (e: any) {
			if (e instanceof AppError) {
				toast.error(e.message, CircleX, 5000);
			} else if (e instanceof Error) {
				// Fallback for unexpected errors
				toast.error(e.message, CircleX, 5000);
			} else {
				toast.error('An unexpected error occurred while fetching anime details.', CircleX, 5000);
			}
			return;
		}
	}
</script>

<svelte:head>
	<title>Admin | New anime | G.O.T Archive</title>
</svelte:head>

<!-- TODO: Mobile UI-->
<div class="flex w-full flex-col items-center justify-center gap-1">
	<div class="flex w-full flex-col gap-1">
		<div class="grid grid-cols-1 gap-1" style="grid-auto-rows: minmax(2.5em, auto)">
			<div class="grid grid-cols-[1fr_3fr] gap-1">
				<Label labelFor="anime-new-anilist-id" shape="rounded">Anilist ID</Label>
				<Input type="number" rounded="lg" id="anime-new-anilist-id" bind:value={anilistId}>
					<LucideIcon icon={Hash} />
				</Input>
			</div>
			<Button
				variant="submit"
				shape="rounded"
				filled
				fullWidth
				onclick={() => {
					fillForm(anilistId);
				}}
			>
				<span class="font-bold">Get</span>
			</Button>
		</div>
		<form
			method="POST"
			action="?/create"
			class="flex flex-col gap-1 min-sm:grid min-sm:grid-cols-[1fr_3fr]"
			style="grid-auto-rows: minmax(2.5em, auto);"
			id="form-new-anime"
			use:enhance
		>
			<SectionTitle shape="rounded" fontWeight="700" appendClass="col-span-2">
				Anime details
			</SectionTitle>
			<Label labelFor="titleNative" shape="rounded" appendClass="max-sm:hidden">Title native</Label>
			<Input
				type="text"
				name="titleNative"
				id="titleNative"
				rounded="lg"
				placeholder={maxSm.current ? 'Title native' : ''}
				bind:value={$form.titleNative}
			>
				<LucideIcon icon={Text} />
			</Input>
			<Label labelFor="titleRomaji" shape="rounded" appendClass="max-sm:hidden">Title romaji</Label>
			<Input
				type="text"
				name="titleRomaji"
				id="titleRomaji"
				rounded="lg"
				placeholder={maxSm.current ? 'Title romaji' : ''}
				bind:value={() => $form.titleRomaji || '', (v) => ($form.titleRomaji = v === '' ? null : v)}
			>
				<LucideIcon icon={Text} />
			</Input>
			<Label labelFor="titleEnglish" shape="rounded" appendClass="max-sm:hidden"
				>Title english</Label
			>
			<Input
				type="text"
				name="titleEnglish"
				id="titleEnglish"
				rounded="lg"
				placeholder={maxSm.current ? 'Title english' : ''}
				bind:value={
					() => $form.titleEnglish || '', (v) => ($form.titleEnglish = v === '' ? null : v)
				}
			>
				<LucideIcon icon={Text} />
			</Input>
			<Label shape="rounded" appendClass="max-sm:hidden">Genres</Label>
			<Select
				rounded
				allowMultiple
				options={data.genres.map((g) => ({ value: g.genreId, label: g.name }))}
				placeholder={maxSm.current ? 'Genres' : ''}
				bind:selected={
					() => {
						return $form.genres.map((g) => ({ value: g.genreId, label: g.name }));
					},
					(v) => ($form.genres = v.map((x) => ({ genreId: x.value, name: x.label })))
				}
			>
				<LucideIcon icon={Tag} />
			</Select>
			<SectionTitle shape="rounded" fontWeight="700" appendClass="col-span-2">
				Playlist links
			</SectionTitle>
			<div class="col-span-2 flex flex-col gap-1">
				{#each $form.links as link, index}
					<div class={['grid grid-cols-2 gap-1 min-sm:grid-cols-3']}>
						<Input
							type="text"
							name="url"
							id="url"
							placeholder="URL"
							rounded="lg"
							bind:value={$form.links[index].url}
							appendClass="col-span-2 min-sm:col-span-1"
						/>
						<Select
							rounded
							placeholder="Select platform"
							options={data.platforms.map((p) => ({ value: p.platformId, label: p.name }))}
							bind:selected={
								() => {
									let platform = data.platforms.find(
										(p) => p.platformId === $form.links[index].platformId
									);
									if (platform !== undefined) {
										return { value: platform.platformId, label: platform.name };
									} else {
										return { value: -1, label: '' };
									}
								},
								(v) => ($form.links[index].platformId = v.value)
							}
						/>
						<Input
							placeholder="Note"
							type="text"
							name="note"
							id="note"
							rounded="lg"
							bind:value={
								() => $form.links[index].note ?? '',
								(v) => ($form.links[index].note = v === '' ? null : v)
							}
						/>
					</div>
				{/each}
				<div class="grid grid-cols-2 gap-1">
					<Button
						variant="submit"
						filled
						fullWidth
						shape="rounded"
						onclick={() =>
							($form.links = [...$form.links, { url: '', platformId: -1, note: null }])}
					>
						<Plus />
					</Button>
					<Button
						variant="danger"
						filled
						fullWidth
						shape="rounded"
						onclick={() => ($form.links = $form.links.slice(0, -1))}
					>
						<Minus />
					</Button>
				</div>
			</div>
			<Button
				variant="submit"
				form="form-new-anime"
				type="submit"
				filled
				fullWidth
				shape="rounded"
				appendClass="col-span-2"
			>
				<span class="font-bold">Submit</span>
			</Button>
		</form>
	</div>
	<div class="w-full">
		<T.Table data={data.anime} sortable filterable />
	</div>
</div>
