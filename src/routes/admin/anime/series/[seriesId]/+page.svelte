<script lang="ts">
	import { Pencil, Trash2, Plus, ArrowLeft } from 'lucide-svelte';
	import { errorMessage } from '$lib/errors';
	import { getAnimeTitle } from '$lib/util';
	import { notification } from '$lib/components/ui/toaster';
	import { modalUtils } from '$lib/components/util';
	import { invalidateAll } from '$app/navigation';
	import { AddAnimeSeason, EditAnimeSeason } from '$lib/components/anime';
	import { deleteSeason } from '$lib/remote/anime.remote';
	import type { PageProps } from './$types';
	import { omit } from 'lodash-es';

	let { data }: PageProps = $props();

	type Season = (typeof data.seasons)[number];

	let editingSeason:
		(Season['data'] & Omit<Season['metadata'], 'animeSeasonMetadataId'>) | undefined =
		$state(undefined);

	function openEditModal(season: Season) {
		editingSeason = {
			...season.data,
			...omit(season.metadata, ['animeSeasonMetadataId'])
		};
		modalUtils.openModal('edit-season-modal');
	}

	async function handleDelete(seasonId: string) {
		const confirmed = confirm(
			'Are you sure you want to delete this season? This action cannot be undone.'
		);
		if (!confirmed) return;

		try {
			await deleteSeason({ seasonId });
			notification.success('Season deleted successfully');
			invalidateAll();
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to delete season'));
		}
	}
</script>

<svelte:head>
	<title>Admin | {getAnimeTitle(data.anime)} | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-6xl p-4">
	<!-- Page Header -->
	<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div>
			<a href="/admin/anime" class="btn btn-ghost btn-sm mb-2">
				<ArrowLeft class="h-4 w-4" />
				Back to Anime
			</a>
			<h1 class="text-3xl font-bold">
				{getAnimeTitle(data.anime)}
			</h1>
			{#if data.anime.titleEnglish && (data.anime.titleRomaji || data.anime.titleNative)}
				<p class="text-base-content/70">
					{data.anime.titleRomaji ?? data.anime.titleNative}
				</p>
			{/if}
		</div>
		<button class="btn btn-primary" onclick={() => modalUtils.openModal('add-season-modal')}>
			<Plus class="h-5 w-5" />
			Add Season
		</button>
	</div>

	<!-- Seasons List -->
	<div class="list bg-base-200 rounded-box shadow">
		{#each data.seasons as season (season.data.animeSeasonId)}
			<div class="list-row items-center py-3">
				<div class="min-w-0 flex-1 px-4">
					<div class="font-medium">
						{season.data.titleEnglish ||
							season.data.titleRomaji ||
							season.data.titleNative ||
							`Season ${season.data.sequence}`}
					</div>
					<div class="text-base-content/60 text-sm">
						{season.data.format}
						{#if season.data.season}
							• {season.data.season}
						{/if}
						{#if season.data.year}
							• {season.data.year}
						{/if}
						{#if season.data.episodes}
							• {season.data.episodes} episodes
						{/if}
					</div>
					{#if season.data.episodeProgress > 0}
						<div class="text-primary mt-1 text-xs">
							Progress: {season.data.episodeProgress}/{season.data.episodes ?? '?'} episodes
						</div>
					{/if}
				</div>

				<div class="flex justify-end gap-2">
					<button class="btn btn-ghost btn-sm" title="Edit" onclick={() => openEditModal(season)}>
						<Pencil class="size-4" />
					</button>

					<button
						class="btn btn-ghost btn-sm text-error"
						title="Delete"
						onclick={() => handleDelete(season.data.animeSeasonId)}
					>
						<Trash2 class="size-4" />
					</button>
				</div>
			</div>
		{:else}
			<div class="text-base-content/60 p-8 text-center">No seasons found</div>
		{/each}
	</div>
</div>

<!-- Add Season Modal (locked to this anime) -->
<AddAnimeSeason id="add-season-modal" anime={[data.anime]} lockedAnimeId={data.anime.animeId} />

<!-- Edit Season Modal -->
<EditAnimeSeason id="edit-season-modal" prefill={editingSeason} />
