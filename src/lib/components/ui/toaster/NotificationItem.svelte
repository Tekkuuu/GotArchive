<script lang="ts">
	import type { Notification } from './types';
	import {
		getNotificationIcon,
		getNotificationColor,
		type NotificationColor
	} from './notificationColor';
	import { notificationState } from './notification-state.svelte';
	import { CircleAlert, CircleCheck, CircleX, Info, Trash2 } from 'lucide-svelte';
	import { formatDistanceToNow } from 'date-fns';

	interface Props {
		notification: Notification;
		showDelete?: boolean;
	}

	let { notification, showDelete = false }: Props = $props();

	const iconColorClass: Record<NotificationColor, string> = {
		success: 'bg-success/15 text-success',
		error: 'bg-error/15 text-error',
		warning: 'bg-warning/15 text-warning',
		info: 'bg-info/15 text-info'
	};

	const icon = $derived(getNotificationIcon(notification));
	const color = $derived(getNotificationColor(notification));
	const formattedTime = $derived(formatDistanceToNow(notification.timestamp, { addSuffix: true }));
</script>

<div class="flex items-start gap-2 rounded-lg p-2 {notification.read ? '' : 'bg-base-200'}">
	<span
		class="flex size-8 shrink-0 items-center justify-center rounded-full {iconColorClass[color]}"
		aria-hidden="true"
	>
		{#if icon === 'success'}
			<CircleCheck class="size-4" />
		{:else if icon === 'error'}
			<CircleX class="size-4" />
		{:else if icon === 'warning'}
			<CircleAlert class="size-4" />
		{:else if icon === 'info'}
			<Info class="size-4" />
		{:else}
			<span class="loading loading-spinner loading-xs"></span>
		{/if}
	</span>

	<button
		type="button"
		class="min-w-0 flex-1 text-left {notification.read ? 'cursor-default' : 'cursor-pointer'}"
		onclick={() => notificationState.markAsRead(notification.id)}
	>
		<p class="text-sm leading-snug {notification.read ? 'text-base-content/70' : 'font-medium'}">
			{notification.message}
		</p>
		<p class="text-base-content/50 mt-1 text-xs">{formattedTime}</p>
	</button>

	{#if !notification.read}
		<span class="status status-primary self-center" aria-label="Unread"></span>
	{/if}

	{#if showDelete}
		<button
			type="button"
			class="btn btn-ghost btn-circle hover:bg-error/15 hover:text-error shrink-0 self-center"
			onclick={() => notificationState.delete(notification.id)}
			aria-label="Delete notification"
		>
			<Trash2 class="size-4" />
		</button>
	{/if}
</div>
