<script lang="ts">
	import { anilistServices as s } from '$lib/anilist';
	import {
		Button,
		LinkButton,
		Checkbox,
		Input,
		Label,
		SectionTitle,
		Select
	} from '$lib/components/forms';
	import { Table } from '$lib/components/table';
	import { Modal } from '$lib/components/ui';
	import { toast } from '$lib/components/ui/toaster';
	import { LucideIcon } from '$lib/components/util';
	import { AnilistError } from '$lib/errors';
	import _ from 'lodash';
	import {
		Calendar,
		Check,
		ChevronRight,
		CircleX,
		Hash,
		Link2,
		Minus,
		Plus,
		SunSnow,
		Text,
		TvMinimalPlay
	} from 'lucide-svelte';
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { formSchema } from './util';
	import { MediaQuery } from 'svelte/reactivity';

	let maxSm: MediaQuery = new MediaQuery('max-width: 39.999rem');

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
				toast.error(result.data?.text || 'Failed to add season', CircleX, 5000);
			} else if (result.type === 'error') {
				toast.error('An unexpected error occurred', CircleX, 5000);
			}
		}
	});

	let anilistId: number = $state(0);
	let episodeDataModalStates: Array<boolean> = $state([]);

	function updateEpisodeData(epCount: number) {
		let episodesData: typeof $form.episodeData = [];
		for (let i = 1; i <= epCount; i++) {
			episodesData.push({ episodeNumber: i, watched: false, links: [] });
			episodeDataModalStates.push(false);
		}
		$form.episodeData = episodesData;
	}

	async function fillForm(anilistId: number) {
		try {
			const response = await s.fetchAnimeSeason(anilistId);
			toast.success('Data fetched successfully', Check, 1000);

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
				toast.error(e.message, CircleX, 5000);
			} else {
				// Fallback for unexpected errors
				toast.error('An unexpected error occured', CircleX, 5000);
			}
			return;
		}
	}
</script>

<svelte:head>
	<title>Admin | New anime season | G.O.T Archive</title>
</svelte:head>

{#snippet anilistLink(rowData: { anilistLink: string })}
	<LinkButton variant="info" filled href={rowData.anilistLink} fullWidth>
		<Link2 />
	</LinkButton>
{/snippet}

<div class="flex w-full flex-col justify-center gap-1 pr-2 pl-2">
	<div class="grid grid-cols-1 gap-1" style="grid-auto-rows: minmax(2.5em, auto);">
		<div class="grid grid-cols-1 gap-1" style="grid-auto-rows: minmax(2.5em, auto)">
			<div class="grid grid-cols-[1fr_3fr] gap-1">
				<Label labelFor="anime-new-anilist-id" shape="rounded">Anilist ID</Label>
				<Input type="number" id="anime-new-anilist-id" rounded="lg" bind:value={anilistId}>
					<LucideIcon icon={Hash} />
				</Input>
			</div>
			<Button
				variant="submit"
				filled
				fullWidth
				shape="rounded"
				onclick={() => {
					fillForm(anilistId);
				}}
			>
				<span class="font-bold">Get</span>
			</Button>
		</div>
	</div>
	<form
		method="POST"
		action="?/create"
		class="flex flex-col gap-1 sm:grid sm:grid-cols-[1fr_3fr]"
		id="form-new-season"
		use:enhance
	>
		<Label shape="rounded" appendClass="max-sm:hidden">Select anime</Label>
		<Select
			placeholder={maxSm.current ? 'Select anime' : ''}
			rounded
			options={data.anime.map((a) => ({
				value: a.animeId,
				label: a.titleEnglish ?? a.titleRomaji ?? a.titleNative
			}))}
			bind:selected={
				() => {
					const anime = data.anime.find((a) => a.animeId === $form.animeId);
					if (anime === undefined) return { value: -1, label: '' };
					else
						return {
							value: anime?.animeId,
							label: anime?.titleEnglish ?? anime?.titleRomaji ?? anime?.titleNative
						};
				},
				(v) => ($form.animeId = v.value)
			}
		>
			<LucideIcon icon={ChevronRight} />
		</Select>
		<Label labelFor="sequence" shape="rounded" appendClass="max-sm:hidden">Sequence</Label>
		<Input
			type="number"
			name="sequence"
			rounded="lg"
			bind:value={$form.sequence}
			placeholder={maxSm.current ? 'Sequence' : ''}
		>
			<LucideIcon icon={Hash} />
		</Input>
		<Label labelFor="titleNative" shape="rounded" appendClass="max-sm:hidden">Title native</Label>
		<Input
			placeholder={maxSm.current ? 'Title native' : ''}
			type="text"
			name="titleNative"
			id="titleNative"
			rounded="lg"
			bind:value={$form.titleNative}
		>
			<LucideIcon icon={Text} />
		</Input>
		<Label labelFor="titleRomaji" shape="rounded" appendClass="max-sm:hidden">Title romaji</Label>
		<Input
			placeholder={maxSm.current ? 'Title romaji' : ''}
			type="text"
			name="titleRomaji"
			id="titleRomaji"
			rounded="lg"
			bind:value={() => $form.titleRomaji || '', (v) => ($form.titleRomaji = v === '' ? null : v)}
		>
			<LucideIcon icon={Text} />
		</Input>
		<Label labelFor="titleEnglish" shape="rounded" appendClass="max-sm:hidden">Title english</Label>
		<Input
			placeholder={maxSm.current ? 'Title english' : ''}
			type="text"
			name="titleEnglish"
			id="titleEnglish"
			rounded="lg"
			bind:value={() => $form.titleEnglish || '', (v) => ($form.titleEnglish = v === '' ? null : v)}
		>
			<LucideIcon icon={Text} />
		</Input>
		<Label labelFor="format" shape="rounded" appendClass="max-sm:hidden">Format</Label>
		<Select
			placeholder={maxSm.current ? 'Format' : ''}
			rounded
			textAlign="justify-start"
			options={data.formats.map((f) => ({ value: f, label: f }))}
			bind:selected={
				() => ({ value: $form.format, label: $form.format }), (v) => ($form.format = v.value)
			}
		>
			<LucideIcon icon={TvMinimalPlay} />
		</Select>
		<Label labelFor="season" shape="rounded" appendClass="max-sm:hidden">Season</Label>
		<Select
			placeholder={maxSm.current ? 'Season' : ''}
			rounded
			textAlign="justify-start"
			options={data.seasons.map((s) => ({ value: s, label: s }))}
			bind:selected={
				() => ({ value: $form.season, label: $form.season }), (v) => ($form.season = v.value)
			}
		>
			<LucideIcon icon={SunSnow} />
		</Select>
		<Label labelFor="seasonYear" shape="rounded" appendClass="max-sm:hidden">Year</Label>
		<Input
			type="number"
			name="seasonYear"
			bind:value={$form.year}
			rounded="lg"
			placeholder={maxSm.current ? 'Year' : ''}
		>
			<LucideIcon icon={Calendar} />
		</Input>
		<Label labelFor="episodes" shape="rounded" appendClass="max-sm:hidden">Episodes</Label>
		<Input
			placeholder={maxSm.current ? 'Episodes' : ''}
			type="number"
			name="episodes"
			rounded="lg"
			bind:value={$form.episodes}
			oninput={() => updateEpisodeData($form.episodes)}
		>
			<LucideIcon icon={Hash} />
		</Input>
		<Label labelFor="siteUrl" shape="rounded" appendClass="max-sm:hidden">Anilist link</Label>
		<Input
			type="text"
			name="siteUrl"
			rounded="lg"
			bind:value={$form.anilistLink}
			placeholder={maxSm.current ? 'Anilist link' : ''}
		>
			<LucideIcon icon={Link2} />
		</Input>
		{#if $form.episodeData.length !== 0}
			<div class="col-span-2 grid grid-cols-12 gap-1" style="grid-auto-rows: minmax(2.5em, auto)">
				{#each $form.episodeData as episode, index}
					<Button
						fullWidth
						variant="default"
						shape="rounded"
						filled
						onclick={() => {
							episodeDataModalStates[index] = true;
						}}
					>
						<span class="text-primary-900 dark:text-primary-50 font-bold"
							>{episode.episodeNumber}</span
						>
					</Button>
					<Modal
						center="horizonal"
						open={episodeDataModalStates[index]}
						onclose={() => (episodeDataModalStates[index] = false)}
					>
						<div class="flex w-full flex-col items-center gap-1">
							<SectionTitle fontWeight="700" shape="rounded">Episode data</SectionTitle>
							<div class="flex w-full gap-1">
								<Label shape="rounded">Watched</Label>
								<Checkbox shape="rounded" bind:value={$form.episodeData[index].watched} />
							</div>
							<SectionTitle fontWeight="700" shape="rounded">Links</SectionTitle>
							{#if $form.episodeData[index].links.length > 0}
								<div class="flex w-full flex-col gap-1">
									{#each $form.episodeData[index].links as link, linkIndex}
										<div class="grid grid-cols-3 gap-1">
											<Input
												type="text"
												name="url"
												id="url"
												placeholder="URL"
												rounded="lg"
												bind:value={$form.episodeData[index].links[linkIndex].url}
											/>
											<Select
												rounded
												placeholder="Select platform"
												options={data.platforms.map((p) => ({
													value: p.platformId,
													label: p.name
												}))}
												bind:selected={
													() => {
														let platform = data.platforms.find(
															(p) =>
																p.platformId ===
																$form.episodeData[index].links[linkIndex].platformId
														);
														if (platform !== undefined) {
															return { value: platform.platformId, label: platform.name };
														} else {
															return { value: -1, label: '' };
														}
													},
													(v) => ($form.episodeData[index].links[linkIndex].platformId = v.value)
												}
											/>
											<Input
												placeholder="Note"
												rounded="lg"
												type="text"
												name="note"
												id="note"
												bind:value={
													() => $form.episodeData[index].links[linkIndex].note ?? '',
													(v) =>
														($form.episodeData[index].links[linkIndex].note = v === '' ? null : v)
												}
											/>
											{#if $errors.episodeData?.[index].links?.[linkIndex].url || $errors.episodeData?.[index].links?.[linkIndex].platformId || $errors.episodeData?.[index].links?.[linkIndex].note}
												<span
													class="dark:bg-primary-700 bg-primary-200 text-danger p-2 text-center font-bold"
												>
													{$errors.episodeData?.[index].links?.[linkIndex].url}
												</span>
												<span
													class="dark:bg-primary-700 bg-primary-200 text-danger p-2 text-center font-bold"
												>
													{$errors.episodeData?.[index].links?.[linkIndex].platformId}
												</span>
												<span
													class="dark:bg-primary-700 bg-primary-200 text-danger p-2 text-center font-bold"
												>
													{$errors.episodeData?.[index].links?.[linkIndex].note}
												</span>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
							<div class="grid w-full grid-cols-2 gap-1">
								<Button
									filled
									fullWidth
									shape="rounded"
									variant="submit"
									onclick={() => {
										const currentLinks = $form.episodeData[index].links ?? [];
										$form.episodeData[index].links = [
											...currentLinks,
											{ url: '', platformId: -1, note: '' }
										];
									}}
								>
									<Plus />
								</Button>
								<Button
									filled
									fullWidth
									shape="rounded"
									variant="submit"
									onclick={() => {
										const currentLinks = $form.episodeData[index].links ?? [];
										$form.episodeData[index].links = _.initial(currentLinks);
									}}
								>
									<Minus />
								</Button>
							</div>
						</div>
					</Modal>
				{/each}
			</div>
		{/if}
		<Button
			variant="submit"
			form="form-new-season"
			type="submit"
			filled
			fullWidth
			shape="rounded"
			appendClass="col-span-2"
		>
			<span class="font-bold">Submit</span>
		</Button>
	</form>
	<div class="w-full">
		<Table
			sortable
			filterable
			data={data.animeSeasons.map((s) =>
				_.pick(s, ['animeId', 'sequence', 'titleEnglish', 'season', 'year', 'format', 'episodes'])
			)}
			columns={[
				{
					header: 'Anilist',
					row: anilistLink
				}
			]}
		/>
	</div>
</div>
