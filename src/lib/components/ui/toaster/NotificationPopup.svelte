<script lang="ts">
	import { notificationState } from './notification-state.svelte';
	import NotificationPopupItem from './NotificationPopupItem.svelte';
	import { fly } from 'svelte/transition';

	const state = notificationState;
</script>

<div
	class="pointer-events-none fixed top-2 left-2 z-[60] flex w-80 max-w-[calc(100vw-1rem)] flex-col gap-2"
	aria-live="polite"
>
	{#each state.popupNotifications as notification (notification.id)}
		<div
			class="pointer-events-auto"
			role="group"
			transition:fly={{ x: -300, duration: 300 }}
			onmouseenter={() => state.pauseDismiss(notification.id)}
			onmouseleave={() => state.resumeDismiss(notification.id)}
			onfocusin={() => state.pauseDismiss(notification.id)}
			onfocusout={() => state.resumeDismiss(notification.id)}
		>
			<NotificationPopupItem {notification} ondismiss={() => state.dismiss(notification.id)} />
		</div>
	{/each}
</div>
