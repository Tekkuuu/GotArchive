<script lang="ts">
	import { notificationState } from './notification-state.svelte';
	import NotificationItem from './NotificationItem.svelte';
	import { X } from 'lucide-svelte';
	import { fly } from 'svelte/transition';

	const state = notificationState;
</script>

{#if state.isDrawerOpen}
  <div
    class="fixed h-screen w-80 top-0 right-0 z-50"
    transition:fly={{ x: 300, duration: 300 }}
  >
    <div class="flex h-full w-80 flex-col gap-2 bg-base-200 shadow-xl border-l-2 border-primary">
      <!-- Header -->
      <div class="flex items-center justify-between border-b p-2 border-primary">
        <h2 class="text-lg font-semibold">Notifications</h2>
        <button
          class="btn btn-ghost btn-sm"
          onclick={() => state.closeDrawer()}
        >
          <X class="size-5" />
        </button>
      </div>

      <!-- Actions -->
      {#if state.notifications.length > 0}
        <div class="flex gap-2 px-2">
          <button
            class="btn btn-success btn-sm flex-1"
            onclick={() => state.markAllAsRead()}
          >
            Mark all read
          </button>
          <button
            class="btn btn-error btn-sm flex-1"
            onclick={() => {
              if (confirm('Delete all notifications?')) {
                state.deleteAll();
              }
            }}
          >
            Clear all
          </button>
        </div>
      {/if}

      <!-- Notification List -->
      <div class="flex flex-1 flex-col px-2 gap-1 overflow-y-auto">
        {#if state.notifications.length === 0}
          <div class="flex h-full items-center justify-center text-sm opacity-50">
            No notifications
          </div>
        {:else}
          {#each state.notifications.slice().reverse() as notification (notification.id)}
            <div transition:fly={{ x: -20, duration: 200 }}>
              <NotificationItem {notification} showDelete={true} />
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
