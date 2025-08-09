<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import { sineInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';

	interface Props {
		error: App.Error;
	}

	let { error }: Props = $props();
	let show: boolean = $state(true);
</script>

<div class="text-danger flex w-full flex-col font-bold">
	<button
		class={[
			'dark:bg-primary-700 bg-primary-200 flex w-full items-center justify-between gap-2 rounded-xl p-2',
			show && 'rounded-b-none'
		]}
		onclick={() => (show = !show)}
	>
		<div class={['*:transition-all *:duration-150', show && '*:rotate-180']}>
			<ChevronDown />
		</div>
		<span>Error occurred and has been reported: {error.message || 'N/A'}</span>
		<div class={['*:transition-all *:duration-150', show && '*:rotate-180']}>
			<ChevronDown />
		</div>
	</button>
	{#if show}
		<div
			class={[
				'dark:bg-primary-700 bg-primary-200 text-primary-900 dark:text-primary-50',
				'flex flex-col items-center justify-center gap-1 rounded-b-xl p-2'
			]}
			transition:slide={{ duration: 150, axis: 'y', easing: sineInOut }}
		>
			<span>Status: {error.status || 'N/A'}</span>
			<span>Error ID: {error.sentryErrorId || 'N/A'}</span>
		</div>
	{/if}
</div>
