<script lang="ts">
	import type { LayoutProps } from './$types';
	import { onMount } from 'svelte';
	import _ from 'lodash';
	import { updateAnimeImagesStore } from '$lib/stores';
	import { logError } from '$lib/client/logger';

	let { data, children }: LayoutProps = $props();

	onMount(() => {
		updateAnimeImagesStore(data.anime.map((a) => a.external.anilistId).filter((x) => x != null)).catch(
			(error) => {
				logError('Failed to update anime images store', { error: String(error) });
			}
		);
	});
</script>

{@render children?.()}
