<script lang="ts">
	import type { LayoutProps } from './$types';
	import { onMount } from 'svelte';
	import _ from 'lodash';
	import { updateAnimeImagesStore } from '$lib/stores';

	let { data, children }: LayoutProps = $props();

	onMount(() => {
		updateAnimeImagesStore(data.anime.map((a) => a.external.anilistId).filter((x) => x != null)).catch(
			(error) => {
				console.error('An error occured while updating images', error);
			}
		);
	});
</script>

{@render children?.()}
