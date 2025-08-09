<script lang="ts" generics="T extends Object">
	import type { Snippet } from 'svelte';
	import { Minus, Plus } from 'lucide-svelte';
	import { Button } from './';

	interface Props {
		row: Snippet<[T, number?]>;
		data: T[];
		inline?: boolean;
	}

	let { row, data = $bindable(), inline = false }: Props = $props();
</script>

<div class="flex h-full w-full flex-col gap-1">
	{#each data as d, index}
		<div class={inline ? 'flex flex-row gap-1' : 'flex flex-col gap-1'}>
			{@render row(d, index)}
		</div>
	{/each}
	<div class="flex gap-1">
		<Button
			variant="submit"
			onclick={(e) => {
				e.preventDefault();
				data = [...data, {} as T];
			}}
			filled
			fullWidth
		>
			<Plus />
		</Button>
		<Button
			variant="danger"
			onclick={(e) => {
				e.preventDefault();
				data.pop();
			}}
			filled
			fullWidth
		>
			<Minus />
		</Button>
	</div>
</div>
