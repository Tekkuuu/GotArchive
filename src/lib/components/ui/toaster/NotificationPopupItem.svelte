<script lang="ts">
	import type { Notification } from './types';
	import { CircleAlert, CircleCheck, CircleX, Info } from 'lucide-svelte';

	interface Props {
		notification: Notification;
	}

	let { notification }: Props = $props();

	const getAlertClass = () => {
		if (notification.type === 'promise') {
			if (notification.promise?.status === 'resolved') {
				return 'alert-success';
			} else if (notification.promise?.status === 'rejected') {
				return 'alert-error';
			}
			return 'alert-info';
		}
		switch (notification.type) {
			case 'success':
				return 'alert-success';
			case 'error':
				return 'alert-error';
			case 'warning':
				return 'alert-warning';
			case 'info':
				return 'alert-info';
			default:
				return 'alert-info';
		}
	};

	const getIcon = () => {
		if (notification.type === 'promise') {
			if (notification.promise?.status === 'pending') {
				return 'loading';
			} else if (notification.promise?.status === 'resolved') {
				return 'success';
			} else if (notification.promise?.status === 'rejected') {
				return 'error';
			}
		}
		return notification.type;
	};

	const icon = $derived(getIcon());
</script>

<div class="alert {getAlertClass()} shadow-lg">
	{#if icon === 'success'}
		<CircleCheck class="size-5" />
	{:else if icon === 'error'}
		<CircleX class="size-5" />
	{:else if icon === 'warning'}
		<CircleAlert class="size-5" />
	{:else if icon === 'info'}
		<Info class="size-5" />
	{:else if icon === 'loading'}
		<span class="loading loading-spinner loading-sm"></span>
	{/if}
	<span class="text-sm">{notification.message}</span>
</div>
