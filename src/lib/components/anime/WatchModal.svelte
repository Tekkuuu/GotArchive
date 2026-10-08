<script lang="ts">
	import { ExternalLink, ListVideo } from 'lucide-svelte';
	import { getAnimeTitle } from '$lib/util';

	/** Minimal anime shape needed to render the playlist popup. */
	export interface WatchModalAnime {
		titleNative: string;
		titleRomaji: string | null;
		titleEnglish: string | null;
		links: Array<[string, string | null]>;
	}

	interface Props {
		/** Anime whose playlists are shown; `null` renders nothing. */
		anime: WatchModalAnime | null | undefined;
		/** Called when the modal is dismissed. */
		onclose: () => void;
	}

	let { anime, onclose }: Props = $props();

	const dialogId = 'watch_modal';

	function close() {
		(document.getElementById(dialogId) as HTMLDialogElement | null)?.close();
		onclose();
	}
</script>

<!-- Watch -->
<dialog class="modal" id={dialogId}>
	{#if anime}
		<div class="modal-box bg-base-200 max-w-md">
			<h3 class="mb-3 text-base font-bold md:text-lg">
				{getAnimeTitle(anime)}
			</h3>

			{#if anime.links.length === 0}
				<p class="text-base-content/70 py-4 text-center">No playlists available.</p>
			{:else}
				<div class="flex flex-col gap-2">
					<p class="text-base-content/70 mb-1 text-sm">Available Playlists:</p>
					{#each anime.links as [url, note]}
						<a
							href={url}
							target="_blank"
							rel="noopener noreferrer"
							class="btn btn-primary btn-sm justify-start"
						>
							<ListVideo class="h-4 w-4" />
							<span class="flex-1 truncate text-left">
								{#if url.includes('youtube')}
									YouTube
								{:else if url.includes('patreon')}
									Patreon
								{:else}
									Watch
								{/if}
								{#if note}
									<span class="text-xs opacity-70">({note})</span>
								{/if}
							</span>
							<ExternalLink class="h-3.5 w-3.5 opacity-70" />
						</a>
					{/each}
				</div>
			{/if}

			<div class="modal-action">
				<button class="btn btn-sm" onclick={close}>Close</button>
			</div>
		</div>
		<form method="dialog" class="modal-backdrop">
			<button onclick={() => onclose()}>close</button>
		</form>
	{/if}
</dialog>
