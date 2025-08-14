<script lang="ts">
	import type { PageProps } from './$types';
	import type { AnimeEpisodeDetails } from '$lib/server/db';
	import { format } from 'date-fns';
	import _ from 'lodash';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { updateFormSchema, createFormSchema, deleteFormSchema } from './util';
	import { toast } from '$lib/components/ui/toaster';
	import { Table } from '$lib/components/table';
	import { Button, Input, DateInput, TimeInput, Select } from '$lib/components/forms';
	import { Modal } from '$lib/components/ui';
	import { X, Pencil, Loader, Clock } from 'lucide-svelte';
	import type { ApiErrorResponse } from '$lib/api';
	import { formatWeekRange } from '$lib/util';
	import { LucideIcon } from '$lib/components/util';
	import { computeDurationStringFromWatchedAfter } from '$lib/util/schedule';

	let { data }: PageProps = $props();
	let entries = $derived.by(() => {
		const grouped = _.groupBy(
			data.schedule.scheduleEntries,
			(e) => e.scheduleEntry.scheduleEntryId
		);
		const result = _.map(grouped, (group) => {
			const { platformId, ...rest } = group[0].scheduleEntry;
			return {
				scheduleEntry: {
					...rest,
					platformIds: group.map((r) => r.scheduleEntry.platformId)
				},
				anime: group[0].anime
			};
		});
		return result;
	});

	let episodes: AnimeEpisodeDetails[] = $state([]);

	let updateModalOpen: boolean = $state(false);
	let loading: Promise<any> | undefined = $state(undefined);

	let createModalOpen: boolean = $state(false);

	async function fetchAnimeEpisodes(animeId: number) {
		if (episodes.find((e) => e.animeId === animeId) !== undefined) return;

		const response = await fetch(`/api/anime-episode?animeId=${animeId}&detailed`);

		if (response.ok) {
			episodes = [...episodes, ...(await response.json())];
		} else {
			try {
				const errorPayload: ApiErrorResponse = await response.json();
				toast.error(
					`${errorPayload.error.message}, Error ID: ${errorPayload.error.sentryErrorId || 'N/A'}`
				);
				console.error(`Error ID: ${errorPayload.error.sentryErrorId || 'N/A'}`);
			} catch (err) {
				toast.error('An unexptected error has occured');
			}
		}
	}

	function getSelectTitleLabel(anime: (typeof data.anime)[number] | undefined): string {
		if (!anime) return '';
		return anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative;
	}

	const {
		enhance: updateEnhance,
		errors: updateErrors,
		submit: updateSubmit,
		form: updateForm
	} = superForm(data.updateForm, {
		dataType: 'json',
		validators: zod4Client(updateFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		invalidateAll: 'force',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Entries updated successfully');
			} else if (result.type === 'failure') {
				toast.error(result.data?.text ?? 'Filed to updated schedule');
			} else if (result.type === 'error') {
				toast.error('Filed to update schedule');
			}
		}
	});

	const {
		enhance: createEnhance,
		errors: createErrors,
		submit: createSubmit,
		form: createForm
	} = superForm(data.createForm, {
		dataType: 'json',
		validators: zod4Client(createFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		invalidateAll: 'force',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Entries created successfully');
			} else if (result.type === 'failure') {
				toast.error(result.data?.text ?? 'Filed to created schedule');
			} else if (result.type === 'error') {
				toast.error('Filed to create schedule');
			}
		}
	});

	const {
		enhance: deleteEnhance,
		errors: deleteErrors,
		submit: deleteSubmit,
		form: deleteForm
	} = superForm(data.deleteForm, {
		dataType: 'json',
		validators: zod4Client(deleteFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		invalidateAll: 'force',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Entry deleted successfully');
			} else if (result.type === 'failure') {
				toast.error(result.data?.text ?? 'Filed to delete entry');
			} else if (result.type === 'error') {
				toast.error('Filed to delete entry');
			}
		}
	});

	async function setModal(id: number) {
		const entry = entries.find((e) => e.scheduleEntry.scheduleEntryId === id);

		if (entry === undefined) {
			toast.error('Entry not found');
			return;
		}

		// General
		$updateForm.scheduleEntryId = entry.scheduleEntry.scheduleEntryId;
		$updateForm.type = entry.scheduleEntry.type;
		$updateForm.platformIds = entry.scheduleEntry.platformIds;
		$updateForm.date = entry.scheduleEntry.date;
		$updateForm.time = entry.scheduleEntry.time;
		$updateForm.note = entry.scheduleEntry.note;

		// Anime specific
		await fetchAnimeEpisodes(entry.anime.animeId);
		if (entry.scheduleEntry.type === 'anime') {
			$updateForm.data = {
				animeId: entry.anime.animeId,
				watchedAfter:
					computeDurationStringFromWatchedAfter(
						entry.scheduleEntry.date,
						entry.scheduleEntry.time,
						entry.anime.watchedAfter
					) || '',
				animeEpisodeIds: episodes
					.filter(
						(e) =>
							e.animeId === entry.anime.animeId &&
							e.titleNative === entry.anime.titleNative &&
							entry.anime.episodes.includes(e.episodeNumber)
					)
					.map((e) => e.animeEpisodeId)
			};
		}
	}
</script>

<svelte:head>
	<title>
		Edit schedule {formatWeekRange(
			data.schedule.scheduleInfo.year,
			data.schedule.scheduleInfo.week
		)} | G.O.T Archive
	</title>
</svelte:head>

{#snippet row(rowData: { scheduleEntryId: number })}
	<div class="flex gap-1">
		<Button
			variant="warning"
			filled
			fullWidth
			onclick={async () => {
				updateModalOpen = true;
				loading = setModal(rowData.scheduleEntryId);
			}}
		>
			<Pencil />
		</Button>
		<Button
			variant="danger"
			filled
			fullWidth
			onclick={() => {
				$deleteForm.scheduleEntryId = rowData.scheduleEntryId;
				deleteSubmit();
			}}
		>
			<X />
		</Button>
	</div>
{/snippet}

<div class="flex w-full flex-col gap-1">
	<form method="POST" action="?/delete" use:deleteEnhance class="hidden">
		<input type="hidden" name="scheduleEntryId" bind:value={$deleteForm.scheduleEntryId} />
	</form>
	<Table
		sortable
		filterable
		data={entries.map((e) => {
			return {
				scheduleEntryId: e.scheduleEntry.scheduleEntryId,
				platforms: data.platforms
					.filter((p) => e.scheduleEntry.platformIds.includes(p.platformId))
					.map((p) => p.name)
					.join(', '),
				date: format(
					new Date(
						`${e.scheduleEntry.date}${e.scheduleEntry.time !== null ? 'T' + e.scheduleEntry.time : ''}Z`
					),
					`EEEE, yyyy-MM-dd${e.scheduleEntry.time !== null ? ' HH:mm' : ''}`
				),
				watchedAfter: format(new Date(e.anime.watchedAfter!), 'EEEE, yyyy-MM-dd HH:mm:ss'),
				anime: e.anime.titleEnglish || e.anime.titleRomaji || e.anime.titleNative,
				episodes: e.anime.episodes.join(', ')
			};
		})}
		columns={[
			{
				header: 'Actions',
				row: row
			}
		]}
	/>
	<div class="flex gap-1">
		<Button
			variant="submit"
			filled
			fullWidth
			onclick={() => {
				createModalOpen = true;
			}}
		>
			<span class="font-bold">New entry</span>
		</Button>
	</div>
	<Modal open={createModalOpen} onclose={() => (createModalOpen = false)} center="both">
		<div
			class="text-primary-900 dark:text-primary-50 mb-2 flex w-full items-center justify-center text-2xl font-bold"
		>
			<h1>Create entry data</h1>
		</div>
		<form method="POST" action="?/create" use:createEnhance class="flex w-full flex-col gap-1">
			<input type="hidden" name="scheduleId" bind:value={$createForm.scheduleId} />
			<div class="grid w-full grid-cols-2 gap-1">
				<Select
					rounded
					placeholder="Entry type"
					options={data.scheduleEntryType.map((t) => ({ label: t, value: t }))}
					bind:selected={
						() => ({
							value: $createForm.type,
							label: data.scheduleEntryType.find((t) => t === $createForm.type) || ''
						}),
						(v) => ($createForm.type = v.value)
					}
				/>
				<Select
					allowMultiple
					rounded
					placeholder="Select platforms"
					options={data.platforms.map((p) => ({ label: p.name, value: p.platformId }))}
					bind:selected={
						() =>
							$createForm.platformIds.map((pId) => ({
								value: pId,
								label:
									data.platforms.find((p) => p.platformId === pId)?.name || 'An error has occurred'
							})),
						(v) => ($createForm.platformIds = v.map((p) => p.value))
					}
				/>
				<DateInput bind:value={$createForm.date} rounded />
				<TimeInput
					rounded
					showSecond={false}
					bind:value={
						() => $createForm.time ?? undefined,
						(v) => (!v ? ($createForm.time = null) : ($createForm.time = v))
					}
				/>
				<Input
					rounded="lg"
					appendClass="col-span-2"
					placeholder="Note"
					type="text"
					bind:value={
						() => $createForm.note ?? '',
						(v) => (v === '' ? ($createForm.note = null) : ($createForm.note = v))
					}
				/>
			</div>
			{#if $createForm.type === 'anime'}
				<div class="grid w-full grid-cols-2 gap-1">
					<Select
						rounded
						search
						options={data.anime.map((a) => ({ value: a.animeId, label: getSelectTitleLabel(a) }))}
						bind:selected={
							() => ({
								value: $createForm.data.animeId,
								label: getSelectTitleLabel(
									data.anime.find((a) => a.animeId === $createForm.data.animeId)
								)
							}),
							(v) => ($createForm.data.animeId = v.value)
						}
						onselect={async () => {
							await fetchAnimeEpisodes($createForm.data.animeId);
						}}
					/>
					<Select
						rounded
						search
						allowMultiple
						disabled={$createForm.data.animeId <= 0}
						options={episodes
							.filter((e) => e.animeId === $createForm.data.animeId)
							.map((e) => ({
								value: e.animeEpisodeId,
								label: `${e.titleEnglish ?? e.titleRomaji ?? e.titleNative}, Ep: ${e.episodeNumber.toString()}`
							}))}
						bind:selected={
							() =>
								$createForm.data.animeEpisodeIds.map((e) => {
									const ep = episodes.find((ep) => ep.animeEpisodeId === e);
									return {
										value: e,
										label: `${ep?.titleEnglish || ep?.titleRomaji || ep?.titleNative || 'Error occurred'}, Ep: ${ep?.episodeNumber || 'Error occured'}`
									};
								}),
							(v) => ($createForm.data.animeEpisodeIds = v.map((e) => e.value))
						}
					/>
				</div>
				<Input
					rounded="lg"
					appendClass="col-span-2"
					placeholder="Watch delay"
					type="text"
					bind:value={$createForm.data.watchedAfter}
				>
					<LucideIcon icon={Clock} />
				</Input>
			{/if}
			<Button
				shape="rounded"
				variant="submit"
				filled
				fullWidth
				onclick={() => {
					$createForm.scheduleId = data.schedule.scheduleInfo.scheduleId;
					createSubmit();
				}}
			>
				<span class="font-bold">Submit</span>
			</Button>
		</form>
	</Modal>
	<Modal open={updateModalOpen} onclose={() => (updateModalOpen = false)} center="both">
		<div
			class="text-primary-900 dark:text-primary-50 mb-2 flex w-full items-center justify-center text-2xl font-bold"
		>
			{#await loading}
				<Loader class="h-full animate-spin" />
			{:then _}
				<h1>Update entry data</h1>
			{/await}
		</div>
		<form method="POST" action="?/update" use:updateEnhance class="flex w-full flex-col gap-1">
			<div class="grid w-full grid-cols-2 gap-1">
				<Select
					rounded
					placeholder="Entry type"
					options={data.scheduleEntryType.map((t) => ({ label: t, value: t }))}
					disabled
					bind:selected={
						() => ({
							value: $updateForm.type,
							label: data.scheduleEntryType.find((t) => t === $updateForm.type) || ''
						}),
						(v) => ($updateForm.type = v.value)
					}
				/>
				<Select
					allowMultiple
					rounded
					placeholder="Select platforms"
					options={data.platforms.map((p) => ({ label: p.name, value: p.platformId }))}
					bind:selected={
						() =>
							$updateForm.platformIds.map((pId) => ({
								value: pId,
								label:
									data.platforms.find((p) => p.platformId === pId)?.name || 'An error has occurred'
							})),
						(v) => ($updateForm.platformIds = v.map((p) => p.value))
					}
				/>
				<DateInput rounded bind:value={$updateForm.date} />
				<TimeInput
					rounded
					showSecond={false}
					bind:value={
						() => $updateForm.time ?? undefined,
						(v) => (!v ? ($updateForm.time = null) : ($updateForm.time = v))
					}
				/>
				<Input
					rounded="lg"
					appendClass="col-span-2"
					placeholder="Note"
					type="text"
					bind:value={
						() => $updateForm.note ?? '',
						(v) => (v === '' ? ($updateForm.note = null) : ($updateForm.note = v))
					}
				/>
			</div>
			{#if $updateForm.type === 'anime'}
				<div class="grid w-full grid-cols-2 gap-1">
					<Select
						rounded
						search
						options={data.anime.map((a) => ({ value: a.animeId, label: getSelectTitleLabel(a) }))}
						bind:selected={
							() => ({
								value: $updateForm.data.animeId,
								label: getSelectTitleLabel(
									data.anime.find((a) => a.animeId === $updateForm.data.animeId)
								)
							}),
							(v) => ($updateForm.data.animeId = v.value)
						}
						onselect={async () => {
							await fetchAnimeEpisodes($updateForm.data.animeId);
						}}
					/>
					<Select
						rounded
						search
						allowMultiple
						disabled={$updateForm.data.animeId <= 0}
						options={episodes
							.filter((e) => e.animeId === $updateForm.data.animeId)
							.map((e) => ({
								value: e.animeEpisodeId,
								label: `${e.titleEnglish ?? e.titleRomaji ?? e.titleNative}, Ep: ${e.episodeNumber.toString()}`
							}))}
						bind:selected={
							() =>
								$updateForm.data.animeEpisodeIds.map((e) => {
									const ep = episodes.find((ep) => ep.animeEpisodeId === e);
									return {
										value: e,
										label: `${ep?.titleEnglish || ep?.titleRomaji || ep?.titleNative || 'Error occurred'}, Ep: ${ep?.episodeNumber || 'Error occured'}`
									};
								}),
							(v) => ($updateForm.data.animeEpisodeIds = v.map((e) => e.value))
						}
					/>
				</div>
				<Input
					rounded="lg"
					appendClass="col-span-2"
					placeholder="Watch delay"
					type="text"
					bind:value={$updateForm.data.watchedAfter}
				>
					<LucideIcon icon={Clock} />
				</Input>
			{/if}
			<Button variant="warning" type="submit" filled fullWidth shape="rounded">
				<span class="font-bold">Submit</span>
			</Button>
		</form>
	</Modal>
</div>
