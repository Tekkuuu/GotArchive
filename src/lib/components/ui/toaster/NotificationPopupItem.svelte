<script lang="ts">
	import type { Notification } from './types';
	import {
		getNotificationIcon,
		getNotificationColor,
		type NotificationColor
	} from './notificationColor';
	import { CircleAlert, CircleCheck, CircleX, Info, X } from 'lucide-svelte';

	interface Props {
		notification: Notification;
		ondismiss?: () => void;
	}

	let { notification, ondismiss }: Props = $props();

	const alertClassByColor: Record<NotificationColor, string> = {
		success: 'alert-success',
		error: 'alert-error',
		warning: 'alert-warning',
		info: 'alert-info'
	};

	const icon = $derived(getNotificationIcon(notification));
	const alertClass = $derived(alertClassByColor[getNotificationColor(notification)]);
</script>

<div class="alert {alertClass} items-center gap-2 px-3 py-2 shadow-lg">
	<span class="shrink-0">
		{#if icon === 'success'}
			<CircleCheck class="size-5" />
		{:else if icon === 'error'}
			<CircleX class="size-5" />
		{:else if icon === 'warning'}
			<CircleAlert class="size-5" />
		{:else if icon === 'info'}
			<Info class="size-5" />
		{:else}
			<span class="loading loading-spinner loading-sm"></span>
		{/if}
	</span>
	<span class="min-w-0 text-sm break-words">{notification.message}</span>
	{#if ondismiss}
		<button
			type="button"
			class="flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/15"
			aria-label="Dismiss notification"
			onclick={ondismiss}
		>
			<X class="size-4" />
		</button>
	{/if}
</div>
