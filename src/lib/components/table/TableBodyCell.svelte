<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	let { children, className }: { children: any; className?: string } = $props();
</script>

<td
	class={twMerge(
		'border-primary-400 border-r-2 p-2 align-middle first:w-max last:border-r-0',
		className
	)}
>
	{@render children?.()}
</td>
