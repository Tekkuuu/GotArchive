<script lang="ts">
	import type { Snippet } from 'svelte';
	import InputError from './InputError.svelte';

	interface Props {
		error?: string | string[] | Record<string, any> | Record<string, any>[];
		fields: Snippet;
	}

	let { error, fields }: Props = $props();
</script>

<div class="flex h-full w-full flex-col gap-1">
	<div class="grid h-full w-full grid-cols-1 gap-1 md:grid-cols-[1fr_3fr]">
		{@render fields()}
	</div>
	{#if error}
		<InputError {error} />
	{/if}
</div>
