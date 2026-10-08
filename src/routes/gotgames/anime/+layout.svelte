<script lang="ts">
	import type { LayoutProps } from './$types';
	import { onMount } from 'svelte';
	import { updateAnimeImagesStore } from '$lib/stores';

	let { data, children }: LayoutProps = $props();

	onMount(() => {
		updateAnimeImagesStore(
			data.anime.map((a) => a.external.anilistId).filter((x) => x != null)
		).catch((error) => {
			console.error('Failed to update anime images store', { error: String(error) });
		});
	});
</script>

{@render children?.()}
