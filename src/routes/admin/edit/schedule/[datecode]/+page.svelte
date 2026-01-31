<script lang="ts">
	import type { PageProps } from './$types';
	import type { AnimeEpisodeDetails } from '$lib/server/db';
	import { format } from 'date-fns';
	import _ from 'lodash';
	import { superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { updateFormSchema, createFormSchema, deleteFormSchema } from './util';
	import { toast } from '$lib/components/ui/toaster';
	import { X, Pencil } from 'lucide-svelte';
	import type { ApiErrorResponse } from '$lib/api';
	import { formatWeekRange } from '$lib/util';
	import { computeDurationStringFromWatchedAfter } from '$lib/util/schedule';
	import { confirm } from '$lib/util';

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
				anime: group[0].anime,
				misc: group[0].misc
			};
		});
		return result;
	});
	let tableAnimeEntries = $derived(
		entries
			.filter((e) => e.scheduleEntry.type === 'anime')
			.map((e) => {
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
					watchedAfter: format(new Date(e.anime!.watchedAfter!), 'EEEE, yyyy-MM-dd HH:mm:ss'),
					anime: e.anime!.titleEnglish || e.anime!.titleRomaji || e.anime!.titleNative,
					episodes: e.anime!.episodes.join(', ')
				};
			})
	);
	let talbeMiscEntries = $derived(
		entries
			.filter((e) => e.scheduleEntry.type === 'misc')
			.map((e) => {
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
					title: e.misc!.title,
					description: e.misc!.description || 'N/A'
				};
			})
	);

	let episodes: AnimeEpisodeDetails[] = $state([]);

	let loading: Promise<any> | undefined = $state(undefined);

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

		// HACK: Type guard for entry, not every entry type is valid for now
		// This does not break anything as in the database only these two types can be seen
		const allowed = ['anime', 'misc'] as const;
		type Allowed = (typeof allowed)[number];
		$updateForm.type = allowed.includes(entry.scheduleEntry.type as Allowed)
			? (entry.scheduleEntry.type as Allowed)
			: 'misc';
		$updateForm.platformIds = entry.scheduleEntry.platformIds;
		$updateForm.date = entry.scheduleEntry.date;
		$updateForm.time = entry.scheduleEntry.time;
		$updateForm.note = entry.scheduleEntry.note;

		// Anime specific
		switch (entry.scheduleEntry.type) {
			case 'anime':
				await fetchAnimeEpisodes(entry.anime!.animeId);
				$updateForm.data = {
					animeId: entry.anime!.animeId,
					watchedAfter:
						computeDurationStringFromWatchedAfter(
							entry.scheduleEntry.date,
							entry.scheduleEntry.time,
							entry.anime!.watchedAfter
						) || '',
					animeEpisodeIds: episodes
						.filter(
							(e) =>
								e.animeId === entry.anime!.animeId &&
								e.titleNative === entry.anime!.titleNative &&
								entry.anime!.episodes.includes(e.episodeNumber)
						)
						.map((e) => e.animeEpisodeId)
				};
				break;
			case 'misc':
				$updateForm.data = {
					title: entry.misc!.title,
					description: entry.misc!.description
				};
				break;
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

<div class="flex w-full flex-col items-center gap-2">
	<form method="POST" action="?/delete" use:deleteEnhance class="hidden">
		<input type="hidden" name="scheduleEntryId" bind:value={$deleteForm.scheduleEntryId} />
	</form>
	{#if tableAnimeEntries.length > 0}
		<div class="rounded-box border-base-content/5 w-full overflow-x-auto border">
			<table class="table">
				<thead>
					<tr class="uppercase">
						{#each _.keys(_.head(tableAnimeEntries)) as header}
							<th>{_.lowerCase(header)}</th>
						{/each}
						<th>actions</th>
					</tr>
				</thead>
				<tbody>
					{#each tableAnimeEntries as entry}
						<tr>
							{#each _.values(entry) as cell}
								<td>{cell}</td>
							{/each}
							<td>
								<button
									class="btn btn-warning"
									onclick={async () => {
										(
											document.getElementById('update_entry_modal') as HTMLDialogElement
										)?.showModal();
										loading = setModal(entry.scheduleEntryId);
									}}
								>
									<Pencil />
								</button>
								<button
									class="btn btn-error"
									onclick={() => {
										confirm(() => {
											$deleteForm.scheduleEntryId = entry.scheduleEntryId;
											deleteSubmit();
										}, 'Are you sure you want to delete this entry?');
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
	{#if talbeMiscEntries.length > 0}
		<div class="rounded-box border-base-content/5 w-full overflow-x-auto border">
			<table class="table">
				<thead>
					<tr class="uppercase">
						{#each _.keys(_.head(talbeMiscEntries)) as header}
							<th>{_.lowerCase(header)}</th>
						{/each}
						<th>actions</th>
					</tr>
				</thead>
				<tbody>
					{#each talbeMiscEntries as entry}
						<tr>
							{#each _.values(entry) as cell}
								<td>{cell}</td>
							{/each}
							<td>
								<button
									class="btn btn-warning"
									onclick={async () => {
										(
											document.getElementById('update_entry_modal') as HTMLDialogElement
										)?.showModal();
										loading = setModal(entry.scheduleEntryId);
									}}
								>
									<Pencil />
								</button>
								<button
									class="btn btn-error"
									onclick={() => {
										confirm(() => {
											$deleteForm.scheduleEntryId = entry.scheduleEntryId;
											deleteSubmit();
										}, 'Are you sure you want to delete this entry?');
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
	<button
		class="btn btn-success btn-block"
		onclick={() => {
			(document.getElementById('add_entry_modal') as HTMLDialogElement)?.showModal();
		}}
	>
		New entry
	</button>
	<dialog class="modal" id="add_entry_modal">
		<div class="modal-box bg-base-300 flex max-w-full flex-col gap-2">
			<form method="POST" action="?/create" use:createEnhance class="flex w-full flex-col gap-1">
				<input type="hidden" name="scheduleId" bind:value={$createForm.scheduleId} />
				<input type="hidden" name="year" bind:value={$createForm.year} />
				<input type="hidden" name="week" bind:value={$createForm.week} />
				<fieldset
					class="fieldset bg-base-200 rounded-box grid grid-cols-1 p-2 md:grid-cols-2 lg:grid-cols-3"
				>
					<legend class="fieldset-legend">Entry</legend>
					<label class="select order-1 w-full">
						<span class="label">Entry</span>
						<select
							bind:value={$createForm.type}
							onselect={() => {
								switch ($createForm.type) {
									case 'anime':
										$createForm.data = {
											animeEpisodeIds: [],
											animeId: -1,
											watchedAfter: ''
										};
										break;
									case 'misc':
										$createForm.data = {
											title: '',
											description: null
										};
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
								$createForm.platformIds = [...$createForm.platformIds, add.platformId];
								e.currentTarget.value = '';
							}}
						>
							<option value={''} selected disabled>Select platform</option>
							{#each data.platforms.filter((p) => !$createForm.platformIds.includes(p.platformId)) as platform}
								<option value={platform.platformId}>{platform.name}</option>
							{/each}
						</select>
					</label>
					<div class="input order-4 w-full overflow-scroll lg:order-3">
						{#each $createForm.platformIds as pid}
							{@const platform = data.platforms.find((p) => p.platformId === pid)}
							<button
								class="btn btn-neutral btn-xs"
								type="button"
								onclick={() =>
									($createForm.platformIds = $createForm.platformIds.filter((p) => p !== pid))}
							>
								{platform?.name || 'An error occurred'}
							</button>
						{/each}
					</div>
					<label class="input order-5 w-full lg:order-4">
						<span class="label">Date</span>
						<input type="date" bind:value={$createForm.date} />
					</label>
					<label class="input order-6 w-full lg:order-5">
						<span class="label">Time</span>
						<input
							type="time"
							bind:value={
								() => $createForm.time ?? '', (v) => ($createForm.time = v === '' ? null : v)
							}
						/>
					</label>
					<label class="input order-2 w-full lg:order-6">
						<span class="label">Note</span>
						<input
							type="text"
							bind:value={
								() => $createForm.note || '', (v) => ($createForm.note = v === '' ? null : v)
							}
						/>
					</label>
				</fieldset>
				<fieldset class="fieldset bg-base-200 rounded-box p-2">
					{#if $createForm.type === 'anime'}
						<legend class="fieldset-legend">Anime details</legend>
						<div class="grid grid-cols-1 gap-2 lg:grid-cols-3">
							<label class="input w-full">
								<span class="label">Watch delay</span>
								<input
									type="text"
									bind:value={
										() => $createForm.data.watchedAfter, (v) => ($createForm.data.watchedAfter = v)
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
										$createForm.data.animeId = found.animeId;
										fetchAnimeEpisodes($createForm.data.animeId);
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
									onchange={() => fetchAnimeEpisodes($createForm.data.animeId)}
									bind:value={() => $createForm.data.animeId, (v) => ($createForm.data.animeId = v)}
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
										$createForm.data.animeEpisodeIds = [
											...$createForm.data.animeEpisodeIds,
											+e.currentTarget.value
										];
										e.currentTarget.value = '-1';
									}}
								>
									<option value={-1} selected disabled>Select episode</option>
									{#each episodes.filter((ep) => ep.animeId === $createForm.data.animeId && !$createForm.data.animeEpisodeIds.includes(ep.animeEpisodeId)) as episode}
										<option value={episode.animeEpisodeId}>
											{episode.titleEnglish || episode.titleRomaji || episode.titleNative || 'N/A'} (Ep
											{episode.episodeNumber})
										</option>
									{/each}
								</select>
							</label>
							<div class="input w-full lg:col-span-2">
								{#each $createForm.data.animeEpisodeIds as epId}
									{@const episode = episodes.find((e) => e.animeEpisodeId === epId)}
									<button
										class="btn btn-neutral btn-xs"
										type="button"
										onclick={() =>
											($createForm.data.animeEpisodeIds = $createForm.data.animeEpisodeIds.filter(
												(e) => e !== epId
											))}
									>
										{getSelectTitleLabel(data.anime.find((a) => a.animeId === episode?.animeId))} - {episode?.titleEnglish ||
											episode?.titleRomaji ||
											episode?.titleNative ||
											'N/A'} (Ep {episode?.episodeNumber || 'N/A'})
									</button>
								{/each}
							</div>
						</div>
					{:else if $createForm.type === 'misc'}
						<legend class="fieldset-legend">Misc details</legend>
						<div class="grid grid-cols-1 gap-1 lg:grid-cols-2">
							<label class="input w-full">
								<span class="label">Title</span>
								<input
									type="text"
									bind:value={() => $createForm.data.title, (v) => ($createForm.data.title = v)}
								/>
							</label>
							<label class="input w-full">
								<span class="label">Description</span>
								<input
									type="text"
									bind:value={
										() => $createForm.data.description || '',
										(v) => ($createForm.data.description = v === '' ? null : v)
									}
								/>
							</label>
						</div>
					{/if}
				</fieldset>
				<button
					class="btn btn-success"
					onclick={() => {
						$createForm.scheduleId = data.schedule.scheduleInfo.scheduleId;
						$createForm.year = data.schedule.scheduleInfo.year;
						$createForm.week = data.schedule.scheduleInfo.week;
						createSubmit();
						(document.getElementById('add_entry_modal') as HTMLDialogElement).close();
					}}
				>
					Submit
				</button>
			</form>
		</div>
	</dialog>
	<dialog class="modal" id="update_entry_modal">
		<div class="modal-box bg-base-300 flex max-w-full flex-col gap-2">
			<form method="POST" action="?/update" use:updateEnhance class="flex w-full flex-col gap-1">
				<input type="hidden" name="year" bind:value={$updateForm.year} />
				<input type="hidden" name="week" bind:value={$updateForm.week} />
				{#await loading}
					<div class="flex items-center justify-center gap-2">
						<div class="loading"></div>
						Loading
					</div>
				{:then}
					<h1 class="text-center font-semibold">Update entry</h1>
				{/await}
				<fieldset
					class="fieldset bg-base-200 rounded-box grid grid-cols-1 p-2 md:grid-cols-2 lg:grid-cols-3"
				>
					<legend class="fieldset-legend">Entry</legend>
					<label class="select bg-base-100! order-1 w-full">
						<span class="label">Entry</span>
						<select
							disabled
							bind:value={$updateForm.type}
							onselect={() => {
								switch ($updateForm.type) {
									case 'anime':
										$updateForm.data = {
											animeEpisodeIds: [],
											animeId: -1,
											watchedAfter: ''
										};
										break;
									case 'misc':
										$updateForm.data = {
											title: '',
											description: null
										};
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
								$updateForm.platformIds = [...$updateForm.platformIds, add.platformId];
								e.currentTarget.value = '';
							}}
						>
							<option value={''} selected disabled>Select platform</option>
							{#each data.platforms.filter((p) => !$updateForm.platformIds.includes(p.platformId)) as platform}
								<option value={platform.platformId}>{platform.name}</option>
							{/each}
						</select>
					</label>
					<div class="input order-4 w-full overflow-scroll lg:order-3">
						{#each $updateForm.platformIds as pid}
							{@const platform = data.platforms.find((p) => p.platformId === pid)}
							<button
								class="btn btn-neutral btn-xs"
								type="button"
								onclick={() =>
									($updateForm.platformIds = $updateForm.platformIds.filter((p) => p !== pid))}
							>
								{platform?.name || 'An error occurred'}
							</button>
						{/each}
					</div>
					<label class="input order-5 w-full lg:order-4">
						<span class="label">Date</span>
						<input type="date" bind:value={$updateForm.date} />
					</label>
					<label class="input order-6 w-full lg:order-5">
						<span class="label">Time</span>
						<input
							type="time"
							bind:value={
								() => $updateForm.time ?? '', (v) => ($updateForm.time = v === '' ? null : v)
							}
						/>
					</label>
					<label class="input order-2 w-full lg:order-6">
						<span class="label">Note</span>
						<input
							type="text"
							bind:value={
								() => $updateForm.note || '', (v) => ($updateForm.note = v === '' ? null : v)
							}
						/>
					</label>
				</fieldset>
				<fieldset class="fieldset bg-base-200 rounded-box p-2">
					{#if $updateForm.type === 'anime'}
						<legend class="fieldset-legend">Anime details</legend>
						<div class="grid grid-cols-1 gap-2 lg:grid-cols-3">
							<label class="input w-full">
								<span class="label">Watch delay</span>
								<input
									type="text"
									bind:value={
										() => $updateForm.data.watchedAfter, (v) => ($updateForm.data.watchedAfter = v)
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
										$updateForm.data.animeId = found.animeId;
										fetchAnimeEpisodes($updateForm.data.animeId);
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
									onchange={() => fetchAnimeEpisodes($updateForm.data.animeId)}
									bind:value={() => $updateForm.data.animeId, (v) => ($updateForm.data.animeId = v)}
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
										$updateForm.data.animeEpisodeIds = [
											...$updateForm.data.animeEpisodeIds,
											+e.currentTarget.value
										];
										e.currentTarget.value = '-1';
									}}
								>
									<option value={-1} selected disabled>Select episode</option>
									{#each episodes.filter((ep) => ep.animeId === $updateForm.data.animeId && !$updateForm.data.animeEpisodeIds.includes(ep.animeEpisodeId)) as episode}
										<option value={episode.animeEpisodeId}>
											{episode.titleEnglish || episode.titleRomaji || episode.titleNative || 'N/A'} (Ep
											{episode.episodeNumber})
										</option>
									{/each}
								</select>
							</label>
							<div class="input w-full lg:col-span-2">
								{#each $updateForm.data.animeEpisodeIds as epId}
									{@const episode = episodes.find((e) => e.animeEpisodeId === epId)}
									<button
										class="btn btn-neutral btn-xs"
										type="button"
										onclick={() =>
											($updateForm.data.animeEpisodeIds = $updateForm.data.animeEpisodeIds.filter(
												(e) => e !== epId
											))}
									>
										{getSelectTitleLabel(data.anime.find((a) => a.animeId === episode?.animeId))} - {episode?.titleEnglish ||
											episode?.titleRomaji ||
											episode?.titleNative ||
											'N/A'} (Ep {episode?.episodeNumber || 'N/A'})
									</button>
								{/each}
							</div>
						</div>
					{:else if $updateForm.type === 'misc'}
						<legend class="fieldset-legend">Misc details</legend>
						<div class="grid grid-cols-1 gap-1 lg:grid-cols-2">
							<label class="input w-full">
								<span class="label">Title</span>
								<input
									type="text"
									bind:value={() => $updateForm.data.title, (v) => ($updateForm.data.title = v)}
								/>
							</label>
							<label class="input w-full">
								<span class="label">Description</span>
								<input
									type="text"
									bind:value={
										() => $updateForm.data.description || '',
										(v) => ($updateForm.data.description = v === '' ? null : v)
									}
								/>
							</label>
						</div>
					{/if}
				</fieldset>
				<button
					class="btn btn-success"
					onclick={() => {
						$updateForm.year = data.schedule.scheduleInfo.year;
						$updateForm.week = data.schedule.scheduleInfo.week;
						updateSubmit();
						(document.getElementById('update_entry_modal') as HTMLDialogElement)?.close();
					}}
				>
					Submit
				</button>
			</form>
		</div>
	</dialog>
</div>
