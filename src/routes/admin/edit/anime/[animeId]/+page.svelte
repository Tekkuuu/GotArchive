<script lang="ts">
	import { Button, LinkButton, Input, InputError, Label, Row, Select } from '$lib/components/forms';
	import { Table } from '$lib/components/table';
	import { Accordion } from '$lib/components/ui';
	import { toast } from '$lib/components/ui/toaster';
	import _ from 'lodash';
	import { Link2, Minus, Pencil, Plus, Tag, Text, X } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { formSchema, deleteFormSchema } from './util';
	import { LucideIcon } from '$lib/components/util';

	let { data }: PageProps = $props();
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

{#snippet row(rowData: { animeId: number; sequence: number })}
	<div class="flex items-center justify-center gap-1">
		<LinkButton variant="warning" filled href={`${rowData.animeId}/${rowData.sequence}`}>
			<Pencil />
		</LinkButton>
		<Button
			variant="danger"
			filled
			onclick={(_) => {
				$deleteForm.animeId = rowData.animeId;
				$deleteForm.sequence = rowData.sequence;
				deleteSubmit();
			}}
		>
			<X />
		</Button>
	</div>
{/snippet}

<div class="flex flex-col items-center justify-center gap-1">
	<form use:deleteEnhance action="?/delete" method="POST" id="delete-form" class="hidden">
		<input type="hidden" name="animeId" bind:value={$deleteForm.animeId} />
		<input type="hidden" name="sequence" bind:value={$deleteForm.sequence} />
	</form>
	{#if data.anime !== undefined}
		<div class="w-full">
			<Accordion title="Edit anime" open={true} rounded>
				<form
					action="?/update"
					id="edit-form"
					method="POST"
					class="grid flex-1 grid-cols-[1fr_3fr] gap-1"
					style="grid-auto-rows: minmax(1fr, auto);"
					use:enhance
				>
					<Label shape="rounded" labelFor="titleNative">Title native</Label>
					<Input
						rounded="lg"
						type="text"
						id="titleNative"
						name="titleNative"
						bind:value={$form.anime.titleNative}
					>
						<LucideIcon icon={Text} />
					</Input>
					<Label shape="rounded" labelFor="titleRomaji">Title romaji</Label>
					<Input
						rounded="lg"
						type="text"
						id="titleRomaji"
						name="titleRomaji"
						bind:value={
							() => $form.anime.titleRomaji || '',
							(v) => ($form.anime.titleRomaji = v === '' ? null : v)
						}
					>
						<LucideIcon icon={Text} />
					</Input>
					<Label shape="rounded" labelFor="titleEnglish">Title english</Label>
					<Input
						rounded="lg"
						type="text"
						id="titleEnglish"
						name="titleEnglish"
						bind:value={
							() => $form.anime.titleEnglish || '',
							(v) => ($form.anime.titleEnglish = v === '' ? null : v)
						}
					>
						<LucideIcon icon={Text} />
					</Input>
					<Label shape="rounded" labelFor="genres">Genres</Label>
					<Select
						rounded
						allowMultiple
						options={data.allGenres.map((g) => ({ value: g.genreId, label: g.name }))}
						bind:selected={
							() => $form.genres.map((g) => ({ value: g.genreId, label: g.name })),
							(v) => ($form.genres = v.map((g) => ({ genreId: g.value, name: g.label })))
						}
					>
						<span class="flex aspect-square h-full items-center justify-center">
							<Tag />
						</span>
					</Select>
					<div class="col-span-2 flex flex-col gap-1">
						{#each $form.links as link, index}
							<div class="grid auto-rows-fr grid-cols-3 gap-1">
								<Input
									rounded="lg"
									placeholder="Playlist url"
									type="text"
									bind:value={$form.links[index].url}
									id={`link-${index}`}
									name={`link-${index}`}
								>
									<LucideIcon icon={Link2} />
								</Input>
								<Select
									rounded
									placeholder="Select platform"
									options={data.allPlatforms.map((p) => ({ label: p.name, value: p.platformId }))}
									bind:selected={
										() => {
											let f = data.allPlatforms.find(
												(p) => p.platformId === $form.links[index].platformId
											);
											return { label: f?.name || '', value: f?.platformId || -1 };
										},
										(v) => ($form.links[index].platformId = v.value)
									}
								/>
								<Input
									rounded="lg"
									placeholder="Note"
									type="text"
									bind:value={
										() => $form.links[index].note ?? '',
										(v) => ($form.links[index].note = v === '' ? null : v)
									}
									id={`note-${index}`}
									name={`note-${index}`}
								>
									<LucideIcon icon={Text} />
								</Input>
							</div>
						{/each}
						<div class="grid grid-cols-2 gap-1">
							<Button
								shape="rounded"
								variant="submit"
								filled
								fullWidth
								onclick={(e) => {
									e.preventDefault();
									$form.links = [...$form.links, { url: '', platformId: -1, note: '' }];
								}}><Plus /></Button
							>
							<Button
								shape="rounded"
								variant="danger"
								filled
								fullWidth
								onclick={(e) => {
									e.preventDefault();
									$form.links = $form.links.slice(0, -1);
								}}><Minus /></Button
							>
						</div>
					</div>
					<Button
						shape="rounded"
						variant="warning"
						filled
						fullWidth
						type="submit"
						form="edit-form"
						appendClass="col-span-2"
					>
						<span class="flex gap-2">
							<Pencil /><span class="font-bold">Edit</span>
						</span>
					</Button>
				</form>
			</Accordion>
		</div>

		<div class="w-full">
			<Accordion title="Seasons" open={true} rounded>
				<div class="flex flex-col gap-1">
					<Table
						data={data.allSeasons.map((s) =>
							_.pick(s, ['animeId', 'sequence', 'titleNative', 'titleRomaji', 'titleEnglish'])
						)}
						columns={[
							{
								header: 'Actions',
								row: row
							}
						]}
					/>
				</div>
			</Accordion>
		</div>
	{/if}
</div>
