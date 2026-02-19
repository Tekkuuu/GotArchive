<script lang="ts">
	import { ArrowLeft, Pencil } from 'lucide-svelte';
	import { modalUtils } from '$lib/components/util';
	import { EditAnimeSeason } from '$lib/components/anime';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const animeTitle = $derived(
		data.anime.titleEnglish ?? data.anime.titleRomaji ?? data.anime.titleNative ?? 'Unknown'
	);
</script>

<svelte:head>
	<title>Admin | Edit Season | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-5xl p-4">
	<!-- Page Header -->
	<div class="mb-6">
		<a href="/admin/anime/series/{data.season.animeId}" class="btn btn-ghost btn-sm mb-2">
			<ArrowLeft class="h-4 w-4" />
			Back to Seasons
		</a>
		<h1 class="text-3xl font-bold">
			{animeTitle} — Season {data.season.sequence}
		</h1>
		{#if data.season.titleEnglish || data.season.titleRomaji}
			<p class="text-base-content/70 mt-1">
				{data.season.titleEnglish ?? data.season.titleRomaji}
			</p>
		{/if}
	</div>

	<!-- Season Info Card -->
	<div class="card bg-base-200 shadow-xl mb-6">
		<div class="card-body">
			<div class="flex items-start justify-between">
				<div class="space-y-1">
					<p class="text-sm text-base-content/60">Format</p>
					<p class="font-medium">{data.season.format}</p>
				</div>
				{#if data.season.season || data.season.year}
					<div class="space-y-1">
						<p class="text-sm text-base-content/60">Air Date</p>
						<p class="font-medium">
							{[data.season.season, data.season.year].filter(Boolean).join(' ')}
						</p>
					</div>
				{/if}
				{#if data.season.episodes}
					<div class="space-y-1">
						<p class="text-sm text-base-content/60">Episodes</p>
						<p class="font-medium">{data.season.episodes}</p>
					</div>
				{/if}
				{#if data.season.episodeProgress > 0}
					<div class="space-y-1">
						<p class="text-sm text-base-content/60">Progress</p>
						<p class="font-medium text-warning">
							{data.season.episodeProgress}/{data.season.episodes ?? '?'}
						</p>
					</div>
				{/if}
			</div>

			{#if data.metadata}
				<div class="divider my-2"></div>
				<div class="flex gap-6">
					{#if data.metadata.anilistId}
						<div>
							<p class="text-sm text-base-content/60">AniList ID</p>
							<p class="font-medium">{data.metadata.anilistId}</p>
						</div>
					{/if}
					{#if data.metadata.malId}
						<div>
							<p class="text-sm text-base-content/60">MAL ID</p>
							<p class="font-medium">{data.metadata.malId}</p>
						</div>
					{/if}
					{#if data.metadata.note}
						<div>
							<p class="text-sm text-base-content/60">Note</p>
							<p class="font-medium">{data.metadata.note}</p>
						</div>
					{/if}
				</div>
			{/if}

			<div class="card-actions justify-end mt-4">
				<button
					class="btn btn-primary"
					onclick={() => modalUtils.openModal('edit-season-modal')}
				>
					<Pencil class="h-4 w-4" />
					Edit Season
				</button>
			</div>
		</div>
	</div>
</div>

<!-- Edit Season Modal (pre-populated from server) -->
<EditAnimeSeason
	id="edit-season-modal"
	sForm={data.editSeasonForm}
	formats={data.formats}
	seasonValues={data.seasonValues}
	action="?/updateSeason"
/>
