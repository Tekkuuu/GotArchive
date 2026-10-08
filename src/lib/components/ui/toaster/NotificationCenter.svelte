<script lang="ts">
	import { notificationState } from './notification-state.svelte';
	import NotificationItem from './NotificationItem.svelte';
	import { Bell, BellOff, CheckCheck, Trash2, X } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	const state = notificationState;

	const hasNotifications = $derived(state.notifications.length > 0);
	const unreadCount = $derived(state.unreadCount);

	function onKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && state.isDrawerOpen) {
			state.closeDrawer();
		}
	}

	function confirmClearAll() {
		if (confirm('Delete all notifications?')) {
			state.deleteAll();
		}
	}
</script>

<svelte:window onkeydown={onKeydown} />

{#if state.isDrawerOpen}
	<!-- Click-away backdrop -->
	<button
		type="button"
		class="fixed inset-0 z-40 cursor-default"
		aria-label="Close notifications"
		onclick={() => state.closeDrawer()}
	></button>

	<div
		class="rounded-box border-base-300 bg-base-100 fixed right-2 bottom-36 left-2 z-50 flex max-h-[min(70dvh,32rem)] w-auto flex-col overflow-hidden border shadow-2xl md:top-20 md:right-2 md:bottom-auto md:left-auto md:w-96"
		role="dialog"
		aria-label="Notifications"
		transition:fly={{ y: -8, duration: 200 }}
	>
		<!-- Header -->
		<header class="border-base-300 bg-base-200 flex items-center gap-2 border-b px-3 py-2">
			<Bell class="size-4" />
			<h2 class="text-sm font-semibold">Notifications</h2>
			{#if unreadCount > 0}
				<span class="badge badge-primary badge-sm">{unreadCount > 99 ? '99+' : unreadCount}</span>
			{/if}

			<div class="ml-auto flex items-center gap-1">
				{#if unreadCount > 0}
					<button
						type="button"
						class="btn btn-ghost tooltip tooltip-bottom"
						data-tip="Mark all as read"
						aria-label="Mark all as read"
						onclick={() => state.markAllAsRead()}
					>
						<CheckCheck class="size-4" />
					</button>
				{/if}
				{#if hasNotifications}
					<button
						type="button"
						class="btn btn-ghost tooltip tooltip-bottom"
						data-tip="Clear all"
						aria-label="Clear all notifications"
						onclick={confirmClearAll}
					>
						<Trash2 class="size-4" />
					</button>
				{/if}
				<button
					type="button"
					class="btn btn-ghost"
					aria-label="Close notifications"
					onclick={() => state.closeDrawer()}
				>
					<X class="size-4" />
				</button>
			</div>
		</header>

		<!-- List -->
		<div class="flex-1 overflow-y-auto p-2">
			{#if !hasNotifications}
				<div class="text-base-content/50 flex flex-col items-center gap-2 py-12">
					<BellOff class="size-8" />
					<p class="text-sm">You're all caught up</p>
				</div>
			{:else}
				<ul class="flex flex-col gap-1">
					{#each state.notifications.slice().reverse() as notification (notification.id)}
						<li transition:fly={{ x: -12, duration: 150 }}>
							<NotificationItem {notification} showDelete={true} />
						</li>
					{/each}
				</ul>
			{/if}
		</div>
	</div>
{/if}
