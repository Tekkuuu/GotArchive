<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		fullWidth?: boolean;
		rounded?: 'none' | 'lg';
		appendClass?: ClassValue;
		cols?: number | 'full';
		rows?: number;
		children?: any;
		value: string;
	}

	let {
		fullWidth = false,
		rounded = 'none',
		appendClass,
		cols = 'full',
		rows = 3,
		children,
		value = $bindable()
	}: Props = $props();
</script>

<div
	class={[
		'bg-primary-200 dark:bg-primary-700 flex items-stretch justify-center gap-1 p-1',
		'text-primary-900 dark:text-primary-50',
		'focus-within:border-b-accent-400 dark:border-primary-700 border-primary-200 border',
		fullWidth && 'w-full',
		rounded === 'lg' && 'rounded-lg',
		appendClass
	]}
>
	{@render children?.()}
	<textarea
		class={['flex focus:outline-none', cols === 'full' && 'w-full']}
		cols={typeof cols === 'number' ? cols : undefined}
		{rows}
		bind:value
	></textarea>
</div>
