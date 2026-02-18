<script lang="ts">
	import { Plus, X } from 'lucide-svelte';
	import type { Icon } from 'lucide-svelte';
	import { getThemeStore, AVAILABLE_THEMES, type Theme } from '$lib/stores';
  import { openModal, closeModal } from '$lib/components/util/modal';

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
	let theme = getThemeStore();
  let modalId = `fab-theme-${crypto.randomUUID()}`;

	function handleItemClick(item: MenuItem) {
		if (item.action === 'theme') {
      openModal(modalId);
		} else if (item.action === 'logout') {
			handleLogout();
		} else if (item.route) {
			window.location.href = item.route;
		}
	}
</script>

<!-- FAB Button - Only show on mobile -->
<div class="fab bottom-20 md:hidden">
  <div tabindex="0" role="button" class="btn btn-lg btn-circle btn-success">
    <Plus />
  </div>
	<!-- Menu Items -->
  {#each items as item}
    <div>
      <button
        class="btn btn-circle"
        onclick={() => handleItemClick(item)}
      >
        <item.icon class="h-5 w-5" />
      </button>
    </div>
  {/each}
</div>

<dialog class="modal" id={modalId}>
  <div class="modal-box">
    <div class="container flex flex-col gap-2">
			{#each AVAILABLE_THEMES as themeName}
				<button
					class="btn btn-secondary btn-outline shadow-lg"
					class:btn-active={theme.value === themeName}
					onclick={() => {
						changeTheme(themeName);
					}}
				>
					{themeName}
				</button>
			{/each}
    </div>
    <div class="modal-action">
      <button class="btn btn-neutral btn-square w-full" onclick={() => closeModal(modalId)}>
        <X />
      </button>
    </div>
  </div>
</dialog>
