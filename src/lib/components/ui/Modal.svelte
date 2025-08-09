<script lang="ts">
	import { X } from 'lucide-svelte';
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		children?: any;
		open?: boolean;
		onclose?: () => void;
		center?: 'vertical' | 'horizonal' | 'both';
		appendClass?: ClassValue;
	}

	let { children, open = false, onclose, center = 'both', appendClass }: Props = $props();
</script>

{#if open}
	<div
		class={[
			'dark:bg-primary-900 bg-primary-50',
			'border-primary-900 dark:border-primary-50 shadow-primary-900',
			'fixed',
			'top-1/2 left-1/2 z-50 flex min-h-1/2',
			'min-w-1/2 -translate-1/2 flex-col',
			'rounded-xl',
			'border p-2 shadow-2xl',
			(center === 'vertical' || center === 'both') && 'justify-center',
			(center === 'horizonal' || center === 'both') && 'items-center',
			appendClass
		]}
	>
		{@render children?.()}
		<button
			type="button"
			class={[
				'dark:bg-primary-900 bg-primary-200',
				'dark:border-primary-50 border-primary-900',
				'hover:bg-primary-200 dark:hover:bg-primary-700',
				'text-primary-900 dark:text-primary-50',
				'absolute top-0 right-0 aspect-square translate-x-1/2 -translate-y-1/2 rounded-lg border p-2',
				'transition-colors duration-75'
			]}
			onclick={onclose}><X /></button
		>
	</div>
{/if}
