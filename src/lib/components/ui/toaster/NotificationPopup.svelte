<script lang="ts">
	import { notificationState } from './notification-state.svelte';
	import NotificationPopupItem from './NotificationPopupItem.svelte';
	import { fly } from 'svelte/transition';

	const state = notificationState;
</script>

<div class="fixed left-2 top-2 gap-2 z-50 flex flex-col w-80">
	{#each state.popupNotifications as notification (notification.id)}
		<button
			class="hover:cursor-pointer tooltip tooltip-bottom"
			data-tip="Dismiss"
			transition:fly={{ x: -300, duration: 300 }}
			onclick={() => {
				state.activePopups.delete(notification.id);
				state.markAsRead(notification.id);
			}}
		>
			<NotificationPopupItem {notification} />
		</button>
	{/each}
</div>
