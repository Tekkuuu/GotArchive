<script lang="ts">
	import { Triangle } from 'lucide-svelte';
	import { sineInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';

	interface Props {
		children?: any;
		open?: boolean;
		title?: string;
		rounded?: boolean;
	}

	let { open = $bindable(), rounded = false, ...props }: Props = $props();

	const style = {
		base: 'flex flex-col gap-1'
	};

	const dark = {
		title: 'dark:text-primary-50',
		icon: 'dark:text-primary-50'
	};

	const light = {
		title: 'text-primary-900',
		icon: 'text-primary-900'
	};
</script>

<div class={[style.base]}>
	<button
		class={[
			'bg-primary-200 dark:bg-primary-700',
			'relative flex flex-1 cursor-pointer items-center justify-center p-2 transition-all duration-150',
			rounded && 'rounded-lg'
		]}
		type="button"
		onclick={(e) => {
			e.preventDefault();
			open = !open;
		}}
	>
		{#if props.title}
			<span class={[dark.title, light.title]}>{props.title}</span>
		{/if}
		<Triangle
			class={`${light.icon} ${dark.icon} absolute top-1/2 right-0 -translate-x-1/2 -translate-y-1/2 transition-all duration-150 ${
				open ? 'rotate-0' : 'rotate-180'
			}`}
		/>
	</button>
	{#if open}
		<div class="h-full w-full" transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}>
			{@render props.children?.()}
		</div>
	{/if}
</div>
