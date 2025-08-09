<script lang="ts">
	import { Button, LinkButton, Select, Checkbox, Input, Label } from '$lib/components/forms';
	import { LucideIcon } from '$lib/components/util/';
	import { toast } from '$lib/components/ui/toaster';
	import _ from 'lodash';
	import { MoveLeft, MoveRight, Pencil, SunSnow, Text, TvMinimalPlay } from 'lucide-svelte';
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

	let episodeFilter: number = $state(0);
</script>

<svelte:head>
	<title>
		Admin | Edit anime season - {data.season.titleEnglish ||
			data.season.titleRomaji ||
			data.season.titleNative} | G.O.T Archive
	</title>
</svelte:head>

<div class="flex flex-col items-center justify-center gap-1">
	{#if data.season !== undefined}
		<div class="w-full">
			<form
				action="?/update"
				id="edit-form"
				method="POST"
				class="grid flex-1 grid-cols-[1fr_3fr] gap-1"
				style="grid-auto-rows: minmax(1fr, auto);"
				use:enhance
			>
				<Label shape="rounded" labelFor="sequence">Sequence</Label>
				<Input rounded="lg" type="text" name="sequence" bind:value={$form.sequence} disabled>
					<LucideIcon icon={Text} />
				</Input>
				<Label shape="rounded" labelFor="titleNative">Title native</Label>
				<Input rounded="lg" type="text" name="titleNative" bind:value={$form.titleNative}>
					<LucideIcon icon={Text} />
				</Input>
				<Label shape="rounded" labelFor="titleRomaji">Title romaji</Label>
				<Input
					rounded="lg"
					type="text"
					name="titleRomaji"
					bind:value={
						() => $form.titleRomaji || '', (v) => ($form.titleRomaji = v === '' ? null : v)
					}
				>
					<LucideIcon icon={Text} />
				</Input>
				<Label shape="rounded" labelFor="titleEnglish">Title english</Label>
				<Input
					rounded="lg"
					type="text"
					name="titleEnglish"
					bind:value={
						() => $form.titleEnglish || '', (v) => ($form.titleEnglish = v === '' ? null : v)
					}
				>
					<LucideIcon icon={Text} />
				</Input>
				<Label shape="rounded" labelFor="format">Format</Label>
				<Select
					textAlign="justify-start"
					options={data.formats.map((f) => ({ value: f, label: f }))}
					bind:selected={
						() => ({ value: $form.format, label: $form.format }), (v) => ($form.format = v.value)
					}
				>
					<LucideIcon icon={TvMinimalPlay} />
				</Select>
				<Label shape="rounded" labelFor="season">Season</Label>
				<Select
					allowDeselect
					textAlign="justify-start"
					options={data.seasons.map((s) => ({ value: s, label: s }))}
					bind:selected={
						() =>
							$form.season === null ? undefined : { value: $form.season, label: $form.season },
						(v) => (v === undefined ? ($form.season = null) : ($form.season = v.value))
					}
				>
					<LucideIcon icon={SunSnow} />
				</Select>
				<Label shape="rounded" labelFor="seasonYear">Year</Label>
				<Input
					rounded="lg"
					type="number"
					name="seasonYear"
					bind:value={
						() => $form.year || '', (v) => (v === '' ? ($form.year = null) : ($form.year = v))
					}
				>
					<LucideIcon icon={Text} />
				</Input>
				<Label shape="rounded" labelFor="episodes">Episodes</Label>
				<Input
					rounded="lg"
					type="number"
					name="episodes"
					bind:value={
						() => $form.episodes || '',
						(v) => (v === '' || v === 0 ? ($form.episodes = null) : ($form.episodes = v))
					}
				>
					<LucideIcon icon={Text} />
				</Input>
				<Label shape="rounded" labelFor="siteUrl">Anilist URL</Label>
				<Input rounded="lg" type="text" name="siteUrl" bind:value={$form.anilistLink}>
					<LucideIcon icon={Text} />
				</Input>
				<Button
					variant="warning"
					filled
					fullWidth
					shape="rounded"
					type="submit"
					form="edit-form"
					appendClass="col-span-2"
				>
					<span class="font-bold">Edit</span>
					<LucideIcon icon={Pencil} />
				</Button>
				{#key data.previous || data.next}
					<div class="col-span-2 grid grid-cols-2 gap-1">
						<LinkButton
							variant="info"
							filled
							fullWidth
							shape="rounded"
							disabled={data.previous === undefined}
							href={data.previous === undefined
								? '#'
								: `/admin/edit/anime/${data.animeId}/${data.previous}`}
						>
							<LucideIcon icon={MoveLeft} />
						</LinkButton>
						<LinkButton
							variant="info"
							filled
							fullWidth
							shape="rounded"
							disabled={data.next === undefined}
							href={data.next === undefined
								? '#'
								: `/admin/edit/anime/${data.animeId}/${data.next}`}
						>
							<LucideIcon icon={MoveRight} />
						</LinkButton>
					</div>
				{/key}
			</form>
		</div>
		<div class="dark:text-primary-50 text-primary-900 flex w-full flex-col">
			<form
				action="?/updateEpisodes"
				id="update-episodes-form"
				method="POST"
				class="flex flex-col gap-1"
				use:updateEpisodesEnhance
			>
				<div class="grid grid-cols-3 gap-1 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-12">
					{#each $updateEpisodesForm.episodes as episode}
						<div class="flex gap-1">
							<input type="hidden" name="animeEpisodeId" bind:value={episode.animeEpisodeId} />
							<Label shape="rounded" fulLWidth>{episode.episodeNumber}</Label>
							<Checkbox shape="rounded" bind:value={episode.watched}></Checkbox>
						</div>
					{/each}
				</div>
				<Button shape="rounded" type="submit" variant="submit" filled fullWidth>
					<span class="font-bold">Update Episodes</span>
				</Button>
			</form>
		</div>
	{/if}
</div>
