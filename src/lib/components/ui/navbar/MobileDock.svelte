<script lang="ts">
	import { page } from '$app/state';
	import { notificationState } from '$lib/components/ui/toaster/notification-state.svelte';
	import { Bell, Calendar, Home, Icon, ShieldUser, TvMinimalPlay } from 'lucide-svelte';

	interface DockItem {
		route: string;
		icon: typeof Icon;
		label: string;
		isNotification?: boolean;
	}

  interface Props {
    items: DockItem[];
  }

  let { items }: Props = $props();
</script>

<div
  class="dock md:hidden"
>
	{#each items  as item}
		{@const ItemIcon = item.icon}
		{#if item.isNotification}
			<button
				class="relative flex flex-col items-center justify-center gap-1 transition-colors"
				onclick={() => notificationState.toggleDrawer()}
			>
				<ItemIcon class="h-5 w-5" />
				<span class="text-xs">{item.label}</span>
				{#if notificationState.unreadCount > 0}
					<span class="status status-success absolute top-1 right-1"></span>
				{/if}
			</button>
		{:else}
			<a
				href={item.route}
				class={[
					'flex flex-col items-center justify-center gap-1 transition-colors',
					page.route.id === item.route
						? 'text-primary'
						: ''
				].join(' ')}
			>
				<ItemIcon class="h-5 w-5" />
				<span class="text-xs">{item.label}</span>
			</a>
		{/if}
	{/each}
</div>
