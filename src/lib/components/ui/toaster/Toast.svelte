<script lang="ts">
	import { onMount } from 'svelte';
	import type { Toast } from './types';
	import { linear } from 'svelte/easing';
	import { Tween } from 'svelte/motion';
	import { CircleAlert, CircleCheck, CircleX, Info, LoaderCircle, X } from 'lucide-svelte';
	import { toast as toastStore } from '.';

	interface Props {
		toast: Toast;
		index: number;
	}

	let { toast, index }: Props = $props();

	const getAlertClass = (type: 'alert' | 'progress') => {
		if (type === 'alert') {
			switch (toast.type) {
				case 'success':
					return 'alert-success';
				case 'error':
					return 'alert-error';
				case 'warning':
					return 'alert-warning';
				case 'info':
					return 'alert-info';
				default:
					return '';
			}
		} else {
			switch (toast.type) {
				case 'success':
					return 'progress-success';
				case 'error':
					return 'progress-error';
				case 'warning':
					return 'progress-warning';
				case 'info':
					return 'progress-info';
				default:
					return '';
			}
		}
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

<div class={['alert alert-soft flex', getAlertClass('alert')]}>
	<span class="aspect-square h-full">
		{#if toast.type === 'success'}
			<CircleCheck />
		{:else if toast.type === 'error'}
			<CircleX />
		{:else if toast.type === 'warning'}
			<CircleAlert />
		{:else if toast.type === 'info'}
			<Info />
		{:else if toast.type === 'promise'}
			<span class="loading"></span>
		{/if}
	</span>
	<div class="flex w-full flex-col gap-1">
		<span class="">{toast.message}</span>
		<progress
			class={['progress w-full', getAlertClass('progress')]}
			value={width.current}
			max={100}
		>
		</progress>
	</div>
	<button
		class="btn btn-ghost"
		onclick={() => {
			toastStore.remove(toast.id);
		}}
	>
		<X />
	</button>
</div>
