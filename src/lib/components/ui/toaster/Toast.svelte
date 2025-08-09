<script lang="ts">
	import { onMount } from 'svelte';
	import { twMerge } from 'tailwind-merge';
	import type { Toast } from './types';
	import { linear, sineInOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';
	import { Tween } from 'svelte/motion';
	import { LoaderCircle } from 'lucide-svelte';

	interface Props {
		toast: Toast;
		index: number;
	}

	let { toast, index }: Props = $props();

	let styles = {
		success: 'text-success',
		error: 'text-danger',
		warning: 'text-warning',
		info: 'text-info',
		promise: 'text-primary-900'
	};

	let bar = {
		success: 'bg-success',
		error: 'bg-danger',
		warning: 'bg-warning',
		info: 'bg-info',
		promise: 'bg-primary-900'
	};

	let width = new Tween(0, { duration: 0, easing: linear });

	onMount(async () => {
		if (toast.promise) {
			await toast.promise.finally(() => {
				width.set(100, { duration: toast.duration });
			});
		} else {
			width.set(100, { duration: toast.duration });
		}
	});
</script>

<div
	class={twMerge(
		'flex h-fit w-full flex-col lg:w-1/2 xl:w-2/5 2xl:w-1/3',
		'bg-primary-50 shadow-primary-900 absolute right-0 items-center justify-center gap-2 p-2 shadow-xl',
		styles[toast.type]
	)}
	style="top: {index}em; transform: scale({100 - index * 5}%); z-index: {-index}"
	in:fly={{ duration: 150, easing: sineInOut, y: -50 }}
>
	<div class="flex gap-2">
		{#if toast.icon && toast.duration > 0}
			{@const Icon = toast.icon}
			<Icon />
		{:else if toast.duration == 0}
			<LoaderCircle class="animate-spin" />
		{/if}
		<span class="font-bold">{toast.message}</span>
	</div>
	<span
		class={twMerge('bg-primary-900 block h-2', bar[toast.type])}
		style="width: {width?.current || 0}%"
	></span>
</div>
