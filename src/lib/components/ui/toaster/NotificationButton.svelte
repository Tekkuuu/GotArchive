<script lang="ts">
	import { notificationState } from './notification-state.svelte';
	import { Bell } from 'lucide-svelte';

	const state = notificationState;
</script>

<button
	class="btn btn-ghost relative btn-square"
	onclick={() => state.toggleDrawer()}
	aria-label="Toggle notifications"
>
	<Bell class="h-5 w-5" />
	{#if state.unreadCount > 0}
    <span class="status status-success absolute top-1 right-1 animate-bounce"></span>
	{/if}
</button>
