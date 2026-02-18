<script lang="ts">
	import { Menu, X } from 'lucide-svelte';
	import type { Icon } from 'lucide-svelte';
	import { scale } from 'svelte/transition';
	import { backOut } from 'svelte/easing';
	import { getThemeStore, AVAILABLE_THEMES, type Theme } from '$lib/stores';

	interface MenuItem {
		label: string;
		route?: string;
		action?: 'theme' | 'logout';
		icon: typeof Icon;
	}

	interface Props {
		items: MenuItem[];
		changeTheme: (theme: Theme) => void;
		handleLogout: () => void;
	}

	let { items, changeTheme, handleLogout }: Props = $props();
	let isOpen = $state(false);
	let showThemeDropdown = $state(false);
	let theme = getThemeStore();

	function toggleMenu() {
		isOpen = !isOpen;
		showThemeDropdown = false;
	}

	function handleItemClick(item: MenuItem) {
		if (item.action === 'theme') {
			showThemeDropdown = !showThemeDropdown;
		} else if (item.action === 'logout') {
			handleLogout();
			isOpen = false;
		} else if (item.route) {
			window.location.href = item.route;
			isOpen = false;
		}
	}
</script>

<!-- FAB Button - Only show on mobile -->
<div class="fixed bottom-20 right-2 z-50 md:hidden">
	<!-- Theme Dropdown -->
	{#if showThemeDropdown}
		<div class="mb-2 flex flex-col gap-1" transition:scale={{ duration: 150 }}>
			{#each AVAILABLE_THEMES as themeName}
				<button
					class="btn btn-secondary btn-sm shadow-lg"
					class:btn-active={theme.value === themeName}
					onclick={() => {
						changeTheme(themeName);
						showThemeDropdown = false;
					}}
				>
					{themeName}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Menu Items -->
	{#if isOpen}
		<div class="mb-2 flex flex-col gap-2">
			{#each items as item, i}
				<button
					transition:scale={{ delay: i * 50, duration: 200, easing: backOut }}
					class="btn btn-circle btn-secondary shadow-lg"
					class:btn-active={item.action === 'theme' && showThemeDropdown}
					onclick={() => handleItemClick(item)}
					aria-label={item.label}
				>
					<item.icon class="h-5 w-5" />
				</button>
			{/each}
		</div>
	{/if}

	<!-- Main FAB -->
	<button
		class="btn btn-primary btn-circle btn-lg shadow-xl"
		onclick={toggleMenu}
		aria-label={isOpen ? 'Close menu' : 'Open menu'}
	>
		{#if isOpen}
			<X class="h-6 w-6" />
		{:else}
			<Menu class="h-6 w-6" />
		{/if}
	</button>
</div>

<!-- Overlay -->
{#if isOpen}
	<button
		type="button"
		class="fixed inset-0 z-40 cursor-default bg-black/20 md:hidden"
		onclick={toggleMenu}
		onkeydown={(e) => e.key === 'Escape' && toggleMenu()}
		transition:scale={{ duration: 200 }}
		aria-label="Close menu"
	></button>
{/if}
