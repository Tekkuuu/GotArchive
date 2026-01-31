<script lang="ts">
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { formSchema, scheduleAnimeDetail, scheduleMiscDetail } from './util';
	import * as z from 'zod';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { toast } from '$lib/components/ui/toaster';
	import { Pencil, X } from 'lucide-svelte';
	import { addDays, addWeeks, getWeek, getYear, startOfISOWeek, format } from 'date-fns';
	import { formatInTimeZone } from 'date-fns-tz';
	import { formatWeekRange } from '$lib/util/';
	import type { AnimeEpisodeDetails } from '$lib/server/db';
	import type { ApiErrorResponse } from '$lib/api';
	import _ from 'lodash';

	type AnimeDetail = z.infer<typeof scheduleAnimeDetail>;
	type MiscDetail = z.infer<typeof scheduleMiscDetail>;

	let { data }: PageProps = $props();
	let { form, enhance, errors } = superForm(data.form, {
		dataType: 'json',
		validators: zodClient(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Schedule create successfully');
			} else if (result.type === 'error' || result.type === 'failure') {
				console.log(result);
				toast.error('Failed to create schedule');
			}
		}
	});

	let episodes: AnimeEpisodeDetails[] = $state([]);
	let entryIndex = $state(0);

	const today = new Date();

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

	function addEntry(weekday: number) {
		(document.getElementById('entry_modal') as HTMLDialogElement).showModal();
		entryIndex = $form.entries.length;

		const jan4 = new Date(Date.UTC($form.schedule.year, 0, 4));
		const firstMonday = startOfISOWeek(jan4);
		const day = addDays(addWeeks(firstMonday, $form.schedule.week - 1), weekday);
		$form.entries = [
			...$form.entries,
			{
				platformIds: [],
				date: format(day, 'yyyy-MM-dd'),
				time: null,
				note: '',
				type: 'anime',
				data: {
					animeEpisodeIds: [],
					animeId: -1,
					watchedAfter: ''
				}
			}
		];
	}

	function getSelectTitleLabel(anime: (typeof data.anime)[number] | undefined): string {
		if (!anime) return '';
		return anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative;
	}

	onMount(() => {
		$form.schedule.year = getYear(addWeeks(today, 1));
		$form.schedule.week = getWeek(addWeeks(today, 1));
	});
</script>

<svelte:head>
	<title>Admin | New schedule | G.O.T Archive</title>
</svelte:head>

{#snippet entryDialog(index: number)}
	<div class="modal-box bg-base-300 flex max-w-full flex-col gap-2">
		<fieldset
			class="fieldset bg-base-200 rounded-box grid grid-cols-1 p-2 md:grid-cols-2 lg:grid-cols-3"
		>
			<legend class="fieldset-legend">Entry {index + 1}</legend>
			<label class="select order-1 w-full">
				<span class="label">Entry</span>
				<select
					bind:value={$form.entries[index].type}
					onselect={() => {
						switch ($form.entries[index].type) {
							case 'anime':
								$form.entries[index].data = {
									animeEpisodeIds: [],
									animeId: -1,
									watchedAfter: ''
								} as AnimeDetail;
								break;
							case 'misc':
								$form.entries[index].data = {
									title: '',
									description: null
								} as MiscDetail;
								break;
						}
					}}
				>
					{#each data.scheduleEntryType as type}
						<option value={type}>{type}</option>
					{/each}
				</select>
			</label>
			<label class="select order-3 w-full lg:order-2">
				<span class="label">Platforms</span>
				<select
					onchange={(e) => {
						const add = data.platforms.find((p) => p.platformId === +e.currentTarget.value);
						if (!add) return;
						$form.entries[index].platformIds = [
							...$form.entries[index].platformIds,
							add.platformId
						];
						e.currentTarget.value = '';
					}}
				>
					<option value={''} selected disabled>Select platform</option>
					{#each data.platforms.filter((p) => !$form.entries[index].platformIds.includes(p.platformId)) as platform}
						<option value={platform.platformId}>{platform.name}</option>
					{/each}
				</select>
			</label>
			<div class="input order-4 w-full overflow-scroll lg:order-3">
				{#each $form.entries[index].platformIds as pid}
					{@const platform = data.platforms.find((p) => p.platformId === pid)}
					<button
						class="btn btn-neutral btn-xs"
						type="button"
						onclick={() =>
							($form.entries[index].platformIds = $form.entries[index].platformIds.filter(
								(p) => p !== pid
							))}
					>
						{platform?.name || 'An error occurred'}
					</button>
				{/each}
			</div>
			<label class="input order-5 w-full lg:order-4">
				<span class="label">Date</span>
				<input type="date" bind:value={$form.entries[index].date} />
			</label>
			<label class="input order-6 w-full lg:order-5">
				<span class="label">Time</span>
				<input
					type="time"
					bind:value={
						() => $form.entries[index].time ?? '',
						(v) => ($form.entries[index].time = v === '' ? null : v)
					}
				/>
			</label>
			<label class="input order-2 w-full lg:order-6">
				<span class="label">Note</span>
				<input
					type="text"
					bind:value={
						() => $form.entries[index].note || '',
						(v) => ($form.entries[index].note = v === '' ? null : v)
					}
				/>
			</label>
		</fieldset>
		<fieldset class="fieldset bg-base-200 rounded-box p-2">
			{#if $form.entries[index].type === 'anime'}
				<legend class="fieldset-legend">Anime details</legend>
				<div class="grid grid-cols-1 gap-2 lg:grid-cols-3">
					<label class="input w-full">
						<span class="label">Watch delay</span>
						<input
							type="text"
							bind:value={
								() => ($form.entries[index].data as AnimeDetail).watchedAfter,
								(v) => (($form.entries[index].data as AnimeDetail).watchedAfter = v)
							}
						/>
					</label>
					<label class="input w-full">
						<span class="label">Anime</span>
						<input
							type="text"
							list="anime-list"
							oninput={(e) => {
								const found = data.anime.find((a) => {
									return (
										e.currentTarget.value === (a.titleEnglish ?? a.titleRomaji ?? a.titleNative)
									);
								});
								if (!found) return;
								($form.entries[index].data as AnimeDetail).animeId = found.animeId;
								fetchAnimeEpisodes(($form.entries[index].data as AnimeDetail).animeId);
								e.currentTarget.value = '';
							}}
						/>
						<datalist id="anime-list">
							{#each data.anime as anime}
								<option value={anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative}
								></option>
							{/each}
						</datalist>
					</label>
					<label class="select w-full">
						<select
							onchange={() =>
								fetchAnimeEpisodes(($form.entries[index].data as AnimeDetail).animeId)}
							bind:value={
								() => ($form.entries[index].data as AnimeDetail).animeId,
								(v) => (($form.entries[index].data as AnimeDetail).animeId = v)
							}
						>
							<option value={-1} selected disabled>Select anime</option>
							{#each data.anime as anime}
								<option value={anime.animeId}>
									{anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative}
								</option>
							{/each}
						</select>
					</label>
					<label class="select w-full">
						<select
							onchange={(e) => {
								($form.entries[index].data as AnimeDetail).animeEpisodeIds = [
									...($form.entries[index].data as AnimeDetail).animeEpisodeIds,
									+e.currentTarget.value
								];
								e.currentTarget.value = '-1';
							}}
						>
							<option value={-1} selected disabled>Select episode</option>
							{#each episodes.filter((ep) => ep.animeId === ($form.entries[index].data as AnimeDetail).animeId && !($form.entries[index].data as AnimeDetail).animeEpisodeIds.includes(ep.animeEpisodeId)) as episode}
								<option value={episode.animeEpisodeId}>
									{episode.titleEnglish || episode.titleRomaji || episode.titleNative || 'N/A'} (Ep {episode.episodeNumber})
								</option>
							{/each}
						</select>
					</label>
					<div class="input w-full lg:col-span-2">
						{#each $form.entries[index].data.animeEpisodeIds as epId}
							{@const episode = episodes.find((e) => e.animeEpisodeId === epId)}
							<button
								class="btn btn-neutral btn-xs"
								type="button"
								onclick={() =>
									(($form.entries[index].data as AnimeDetail).animeEpisodeIds = (
										$form.entries[index].data as AnimeDetail
									).animeEpisodeIds.filter((e) => e !== epId))}
							>
								{getSelectTitleLabel(data.anime.find((a) => a.animeId === episode?.animeId))} - {episode?.titleEnglish ||
									episode?.titleRomaji ||
									episode?.titleNative ||
									'N/A'} (Ep {episode?.episodeNumber || 'N/A'})
							</button>
						{/each}
					</div>
				</div>
			{:else if $form.entries[index].type === 'misc'}
				<legend class="fieldset-legend">Misc details</legend>
				<div class="grid grid-cols-1 gap-1 lg:grid-cols-2">
					<label class="input w-full">
						<span class="label">Title</span>
						<input
							type="text"
							bind:value={
								() => ($form.entries[index].data as MiscDetail).title,
								(v) => (($form.entries[index].data as MiscDetail).title = v)
							}
						/>
					</label>
					<label class="input w-full">
						<span class="label">Description</span>
						<input
							type="text"
							bind:value={
								() => ($form.entries[index].data as MiscDetail).description || '',
								(v) => (($form.entries[index].data as MiscDetail).description = v === '' ? null : v)
							}
						/>
					</label>
				</div>
			{/if}
		</fieldset>
		<div class="modal-action justify-end">
			<button
				class="btn"
				type="button"
				onclick={() => {
					(document.getElementById('entry_modal') as HTMLDialogElement).close();
				}}
			>
				Close
			</button>
		</div>
	</div>
{/snippet}

{#snippet entry(entryData: (typeof $form.entries)[number], index: number)}
	<li
		class="bg-base-300 border-b-secondary flex flex-wrap items-center justify-between gap-x-4 border-b px-4 py-2"
	>
		<div class="flex flex-shrink-0 items-center gap-x-2">
			<span class="badge">{_.startCase(entryData.type)}</span>
			<span class="font-semibold">
				{formatInTimeZone(
					new Date(`${entryData.date}T${entryData.time || '00:00:00.000'}Z`),
					'UTC',
					'EEE, HH:mm'
				)} UTC
			</span>

			<details class="dropdown dropdown-center">
				<summary class="btn btn-xs btn-primary btn-outline m-1 text-nowrap">
					{entryData.platformIds.length} platform{entryData.platformIds.length === 1 ? '' : 's'}
				</summary>
				<ul
					class="dropdown-content bg-base-100 rounded-box z-[1] flex flex-col items-center gap-2 p-2 shadow-sm **:text-nowrap"
				>
					{#each entryData.platformIds as pid}
						{@const platform = data.platforms.find((p) => p.platformId === pid)}
						<li>
							<span class="badge badge-primary">{platform?.name || 'N/A'}</span>
						</li>
					{/each}
				</ul>
			</details>
		</div>

		{#if entryData.type === 'anime'}
			{@const anime = data.anime.find((a) => a.animeId === (entryData.data as AnimeDetail).animeId)}
			{@const eps = _.intersection(
				episodes.map((e) => e.animeEpisodeId),
				entryData.data.animeEpisodeIds
			).map((id) => episodes.find((ep) => ep.animeEpisodeId === id))}
			<div class="truncate font-semibold">
				{anime?.titleEnglish || anime?.titleRomaji || anime?.titleNative || 'N/A'}
			</div>
			<details class="dropdown dropdown-center">
				<summary class="btn btn-xs btn-primary btn-outline m-1 text-nowrap">
					{eps.length} episode{eps.length === 1 ? '' : 's'}
				</summary>
				<ul
					class="dropdown-content bg-base-100 rounded-box z-[1] flex flex-col items-center gap-2 p-2 shadow-sm **:text-nowrap"
				>
					{#each eps as ep}
						<li>
							<span class="badge badge-primary">
								{ep?.titleEnglish || ep?.titleRomaji || ep?.titleNative || 'N/A'} (Ep {ep?.episodeNumber})
							</span>
						</li>
					{/each}
				</ul>
			</details>
		{:else if entryData.type === 'misc'}
			<div class="truncate font-semibold">{entryData.data.title}</div>
			<div class="truncate">{entryData.data.description}</div>
		{/if}
		{#if entryData.note}
			<div class="truncate italic">{entryData.note}</div>
		{/if}

		<!-- Actions -->
		<div class="ml-auto flex flex-shrink-0 gap-1">
			<button
				class="btn btn-xs btn-warning"
				type="button"
				onclick={() => {
					entryIndex = index;
					(document.getElementById('entry_modal') as HTMLDialogElement).showModal();
				}}
				aria-label="Edit entry"
			>
				<Pencil />
			</button>
			<button
				class="btn btn-xs btn-error"
				type="button"
				onclick={() => {
					$form.entries = _.filter($form.entries, (e, i) => i !== index);
				}}
				aria-label="Delete entry"
			>
				<X />
			</button>
		</div>
	</li>
{/snippet}

<div>
	<form method="POST" action="?/create" use:enhance class="flex flex-col gap-2">
		<fieldset class="fieldset bg-base-300 rounded-box flex flex-col p-2 md:flex-row">
			<legend class="fieldset-legend">Schedule info</legend>
			<label class="input w-full">
				<span class="label">Year</span>
				<input type="number" min={1900} max={2100} bind:value={$form.schedule.year} />
			</label>
			<label class="input w-full">
				<span class="label">Week</span>
				<input type="number" min={1} max={53} bind:value={$form.schedule.week} />
			</label>
			<label class="input w-full">
				<span class="label">Note</span>
				<input
					type="text"
					bind:value={
						() => $form.schedule.note || '', (v) => ($form.schedule.note = v === '' ? null : v)
					}
				/>
			</label>
			<label class="flex cursor-pointer items-center gap-2">
				<span class="label-text">Public</span>
				<input type="checkbox" class="toggle" bind:checked={$form.schedule.preview} />
				<span class="label-text">Hidden</span>
			</label>
		</fieldset>

		<ul class="list bg-base-300 rounded-box shadow-sm">
			<li class="p-2">{formatWeekRange($form.schedule.year, $form.schedule.week)}</li>
			{#each $form.entries as entryData, i}
				{@render entry(entryData, i)}
			{/each}
		</ul>
		<fieldset class="fieldset rounded-box bg-base-300 grid grid-cols-4 p-2 md:grid-cols-7">
			<button class="btn btn-info" type="button" onclick={() => addEntry(0)}>Monday</button>
			<button class="btn btn-info" type="button" onclick={() => addEntry(1)}>Tuesday</button>
			<button class="btn btn-info" type="button" onclick={() => addEntry(2)}>Wednesday</button>
			<button class="btn btn-info" type="button" onclick={() => addEntry(3)}>Thursday</button>
			<button class="btn btn-info" type="button" onclick={() => addEntry(4)}>Friday</button>
			<button class="btn btn-info" type="button" onclick={() => addEntry(5)}>Saturday</button>
			<button class="btn btn-info max-md:col-span-2" type="button" onclick={() => addEntry(6)}
				>Sunday</button
			>
		</fieldset>
		<button class="btn btn-success">Submit</button>
	</form>
	<dialog class="modal" id="entry_modal">
		{#if $form.entries.length > 0}
			{@render entryDialog(entryIndex)}
		{/if}
	</dialog>
</div>
