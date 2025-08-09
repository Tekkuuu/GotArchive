<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		value?: boolean;
		fullWidth?: boolean;
		filled?: boolean;
		checkedColor?: string;
		shape?: 'rect' | 'rounded' | 'circle';
	}

	let { value = $bindable(), fullWidth = false, filled = false, shape = 'rect' }: Props = $props();
</script>

<span class={[fullWidth ? 'w-full' : 'aspect-square']}>
	<input type="checkbox" bind:checked={value} class="peer hidden" />
	<button
		type="button"
		class={[
			'peer-checked:*:bg-success',
			'p-1 transition-all duration-150',
			'min-h-10',
			filled && 'dark:bg-primary-700',
			!filled && 'dark:border-primary-700 border',
			fullWidth ? 'w-full' : 'aspect-square',
			shape === 'rounded' && 'rounded-lg',
			shape === 'circle' && 'rounded-full'
		]}
		aria-label="checkbox"
		onclick={(_) => (value = !value)}
	>
		<span
			class={[
				'block h-full w-full transition-all duration-150',
				shape === 'rounded' && 'rounded-md',
				shape === 'circle' && 'rounded-full'
			]}
		></span>
	</button>
</span>
