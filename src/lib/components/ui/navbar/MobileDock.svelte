<script lang="ts">
	import { page } from '$app/state';
	import type { Icon } from 'lucide-svelte';
	import { notificationState } from '$lib/components/ui/toaster/notification-state.svelte';

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
	class="btm-nav btm-nav-sm fixed bottom-0 left-0 z-40 h-16 border-t border-base-content/10 bg-base-300 md:hidden"
>
	{#each items as item}
		{@const ItemIcon = item.icon}
		{#if item.isNotification}
			<button
				class="relative flex flex-col items-center justify-center gap-1 transition-colors"
				onclick={() => notificationState.toggleDrawer()}
			>
				<ItemIcon class="h-5 w-5" />
				<span class="text-xs">{item.label}</span>
				{#if notificationState.unreadCount > 0}
					<span
						class="badge badge-error badge-xs absolute right-2 top-1 h-4 min-w-4 text-[10px]"
					>
						{notificationState.unreadCount > 99 ? '99+' : notificationState.unreadCount}
					</span>
				{/if}
			</button>
		{:else}
			<a
				href={item.route}
				class={[
					'flex flex-col items-center justify-center gap-1 transition-colors',
					page.route.id === item.route
						? 'active bg-primary text-primary-content'
						: 'text-base-content/70 hover:text-base-content'
				].join(' ')}
			>
				<ItemIcon class="h-5 w-5" />
				<span class="text-xs">{item.label}</span>
			</a>
		{/if}
	{/each}
</div>
