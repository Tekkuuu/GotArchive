<script lang="ts">
	import type { Notification } from './types';
	import { CircleAlert, CircleCheck, CircleX, Info, Trash2 } from 'lucide-svelte';
	import { notificationState } from './notification-state.svelte';
	import { formatDistanceToNow } from 'date-fns';

	interface Props {
		notification: Notification;
		showDelete?: boolean;
	}

	let { notification, showDelete = false }: Props = $props();

	const getBorderColor = () => {
		if (notification.type === 'promise') {
			if (notification.promise?.status === 'resolved') return 'border-success';
			if (notification.promise?.status === 'rejected') return 'border-error';
			return 'border-info';
		}
		switch (notification.type) {
			case 'success':
				return 'border-success';
			case 'error':
				return 'border-error';
			case 'warning':
				return 'border-warning';
			case 'info':
				return 'border-info';
			default:
				return 'border-base-content/20';
		}
	};

	const getIconColor = () => {
		if (notification.type === 'promise') {
			if (notification.promise?.status === 'resolved') return 'text-success';
			if (notification.promise?.status === 'rejected') return 'text-error';
			return 'text-info';
		}
		switch (notification.type) {
			case 'success':
				return 'text-success';
			case 'error':
				return 'text-error';
			case 'warning':
				return 'text-warning';
			case 'info':
				return 'text-info';
			default:
				return 'text-base-content';
		}
	};

	const getIcon = () => {
		if (notification.type === 'promise') {
			if (notification.promise?.status === 'pending') return 'loading';
			if (notification.promise?.status === 'resolved') return 'success';
			if (notification.promise?.status === 'rejected') return 'error';
		}
		return notification.type;
	};

	const icon = $derived(getIcon());
	const formattedTime = $derived(formatDistanceToNow(notification.timestamp, { addSuffix: true }));
	const isRead = $derived(notification.read);
</script>

<div
	class="flex items-center gap-2 p-2 border-l-2 {getBorderColor()} rounded-r transition-colors {isRead
		? 'bg-base-100 opacity-60'
		: 'bg-base-200'}"
>
	<div class="flex items-center {getIconColor()}">
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
	</div>
	<div class="flex-1 min-w-0">
		<p class="text-sm truncate {isRead ? '' : 'font-semibold'}">{notification.message}</p>
		<p class="text-xs opacity-60">{formattedTime}</p>
	</div>
	{#if !isRead}
		<span class="size-2 rounded-full bg-primary shrink-0"></span>
	{/if}
	{#if showDelete}
		<button
			class="btn btn-ghost btn-xs"
			onclick={() => notificationState.delete(notification.id)}
			aria-label="Delete notification"
		>
			<Trash2 class="size-4" />
		</button>
	{/if}
</div>
