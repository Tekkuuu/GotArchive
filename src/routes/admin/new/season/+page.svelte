<script lang="ts">
	import { anilistServices as s } from '$lib/anilist';
	import { toast } from '$lib/components/ui/toaster';
	import { AnilistError } from '$lib/errors';
	import _ from 'lodash';
	import { Minus, Plus } from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { formSchema } from './util';

	let { data }: PageProps = $props();
	let { form, enhance, errors } = superForm(data.form, {
		dataType: 'json',
		validators: zod(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime season create successfully');
			} else if (result.type === 'failure') {
				toast.error(result.data?.text || 'Failed to add season', 5000);
			} else if (result.type === 'error') {
				toast.error('An unexpected error occurred', 5000);
			}
		}
	});

	let anilistId: number = $state(0);
	let epEdit = $state(0);

	function updateEpisodeData(epCount: number) {
		let episodesData: typeof $form.episodeData = [];
		for (let i = 1; i <= epCount; i++) {
			episodesData.push({ episodeNumber: i, watched: false, links: [] });
		}
		$form.episodeData = episodesData;
	}

	async function fillForm(anilistId: number) {
		try {
			const response = await s.fetchAnimeSeason(anilistId);
			toast.success('Data fetched successfully', 1000);

			// Fill form
			$form.titleNative = response.title.native;
			$form.titleRomaji = response.title.romaji;
			$form.titleEnglish = response.title.english;
			$form.format = data.formats.find((f) => f === response.format) || 'TV';
			$form.season = response.season;
			$form.year = response.seasonYear;
			$form.episodes = response.episodes;
			updateEpisodeData(response.episodes);
			$form.anilistLink = response.siteUrl;
		} catch (e: any) {
			if (e instanceof AnilistError) {
				toast.error(e.message, 5000);
			} else {
				// Fallback for unexpected errors
				toast.error('An unexpected error occured', 5000);
			}
			return;
		}
	}
</script>

<svelte:head>
	<title>Admin | New anime season | G.O.T Archive</title>
</svelte:head>

<div class="flex w-full flex-col justify-center gap-2">
	<label class="input w-full">
		<span class="label">Anilist ID</span>
		<input type="number" bind:value={anilistId} />
	</label>
	<button
		class="btn btn-success"
		onclick={() => {
			fillForm(anilistId);
		}}
	>
		Get
	</button>
	<form
		method="POST"
		action="?/create"
		class="flex flex-col gap-2"
		id="form-new-season"
		use:enhance
	>
		<fieldset class="fieldset bg-base-300 rounded-box p-2">
			<legend class="fieldset-legend">Season</legend>
			<label class="input w-full">
				<span class="label">Anime</span>
				<input
					type="text"
					list="anime-list"
					oninput={(e) => {
						const found = data.anime.find((a) => {
							return e.currentTarget.value === (a.titleEnglish ?? a.titleRomaji ?? a.titleNative);
						});
						if (!found) return;
						$form.animeId = found.animeId;
						e.currentTarget.value = '';
					}}
				/>
				<datalist id="anime-list">
					{#each data.anime as anime}
						<option value={anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative}></option>
					{/each}
				</datalist>
			</label>
			<label class="select w-full">
				<select bind:value={$form.animeId}>
					<option value={-1} selected disabled>Select anime</option>
					{#each data.anime as anime}
						<option value={anime.animeId}>
							{anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative}
						</option>
					{/each}
				</select>
			</label>
			<label class="input w-full">
				<span class="label">Sequence</span>
				<input type="number" bind:value={$form.sequence} />
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
			<label class="input w-full">
				<span class="label">Short title</span>
				<input
					type="text"
					bind:value={() => $form.shortTitle || '', (v) => ($form.shortTitle = v === '' ? null : v)}
				/>
			</label>
			<label class="select w-full">
				<span class="label">Format</span>
				<select class="select" bind:value={$form.format}>
					{#each data.formats as format}
						<option value={format}>{format}</option>
					{/each}
				</select>
			</label>
			<label class="select w-full">
				<span class="label">Season</span>
				<select class="select" bind:value={$form.season}>
					<option value={null}>N/A</option>
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
					min={1900}
					max={2100}
				/>
			</label>
			<label class="input w-full">
				<span class="label">Episodes</span>
				<input
					type="number"
					bind:value={() => $form.episodes || '', (v) => ($form.episodes = v === '' ? null : v)}
					min={1}
				/>
			</label>
			<label class="input w-full">
				<span class="label">Anilist URL</span>
				<input type="text" bind:value={$form.anilistLink} />
			</label>
		</fieldset>
		{#if $form.episodeData.length !== 0}
			<div class="grid grid-cols-12 gap-2">
				{#each $form.episodeData as episode, index}
					<button
						type="button"
						class="btn btn-primary"
						onclick={() => {
							epEdit = index;
							(document.getElementById('episode_modal') as HTMLDialogElement).showModal();
						}}
					>
						{episode.episodeNumber}
					</button>
				{/each}
			</div>
			<dialog class="modal" id="episode_modal">
				<div class="modal-box bg-base-300 flex flex-col gap-2">
					<fieldset class="fieldset bg-base-300 rounded-box p-2">
						<legend class="fieldset-legend">
							Episode {$form.episodeData[epEdit].episodeNumber} details
						</legend>
						<label class="label">
							<input
								type="checkbox"
								class="checkbox"
								bind:checked={$form.episodeData[epEdit].watched}
							/>
							Watched
						</label>
					</fieldset>
					<fieldset class="fieldset bg-base-300 rounded-box p-2">
						<legend class="fieldset-legend">Links</legend>
						{#if $form.episodeData[epEdit]?.links?.length > 0}
							<div class="flex w-full flex-col gap-2">
								{#each $form.episodeData[epEdit].links as link, linkIndex}
									<div class="flex flex-col gap-2">
										<label class="floating-label grow">
											<span>URL</span>
											<input
												class="input w-full"
												type="text"
												placeholder="URL"
												bind:value={$form.episodeData[epEdit].links[linkIndex].url}
											/>
										</label>
										<label class="floating-label grow">
											<span>Platform</span>
											<select class="select w-full">
												<option value={-1} disabled selected>Select platform</option>
												{#each data.platforms as platform}
													<option value={platform.platformId}>
														{platform.name}
													</option>
												{/each}
											</select>
										</label>
										<label class="floating-label grow">
											<span>Note</span>
											<input
												type="text"
												class="input w-full"
												placeholder="Note"
												bind:value={
													() => $form.episodeData[epEdit].links[linkIndex].note || '',
													(v) =>
														($form.episodeData[epEdit].links[linkIndex].note = v === '' ? null : v)
												}
											/>
										</label>
									</div>
								{/each}
							</div>
						{/if}
					</fieldset>
					<div class="flex gap-2">
						<button
							type="button"
							class="btn btn-success grow"
							onclick={() => {
								const currentLinks = $form.episodeData[epEdit].links ?? [];
								$form.episodeData[epEdit].links = [
									...currentLinks,
									{ url: '', platformId: -1, note: '' }
								];
							}}
						>
							<Plus />
						</button>
						<button
							type="button"
							class="btn btn-error grow"
							onclick={() => {
								$form.episodeData[epEdit].links = _.dropRight($form.episodeData[epEdit].links);
							}}
						>
							<Minus />
						</button>
					</div>
					<div class="modal-action">
						<button
							type="button"
							class="btn"
							onclick={() => {
								(document.getElementById('episode_modal') as HTMLDialogElement).close();
							}}>Close</button
						>
					</div>
				</div>
			</dialog>
		{/if}
		<button class="btn btn-success">Submit</button>
	</form>
</div>
