<script lang="ts">
	import { Plus, X, Globe } from 'lucide-svelte';
	import type { Icon } from 'lucide-svelte';
	import { goto } from '$app/navigation';
	import { getThemeStore, AVAILABLE_THEMES, type Theme } from '$lib/stores';
	import { openModal, closeModal } from '$lib/components/util/modal';
	import TimezoneSelect from '$lib/components/schedule/TimezoneSelect.svelte';

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
		/** Raw `tz` query value (null = use persisted choice). */
		tzRaw: string | null;
	}

	let { items, changeTheme, handleLogout, tzRaw }: Props = $props();
	let theme = getThemeStore();
	// Fixed id avoids SSR mismatch.
	const modalId = 'fab-theme-modal';
	const tzModalId = 'fab-tz-modal';

	function handleItemClick(item: MenuItem) {
		if (item.action === 'theme') {
			openModal(modalId);
		} else if (item.action === 'logout') {
			handleLogout();
		} else if (item.route) {
			goto(item.route);
		}
	}
</script>

<!-- FAB -->
<div class="fab bottom-20 md:hidden">
	<button class="btn btn-lg btn-circle btn-success" aria-label="Open menu">
		<Plus />
	</button>
	<!-- Items -->
	<div>
		<button
			class="btn btn-circle"
			aria-label="Display timezone"
			onclick={() => openModal(tzModalId)}
		>
			<Globe class="h-5 w-5" />
		</button>
	</div>
	{#each items as item}
		<div>
			<button class="btn btn-circle" onclick={() => handleItemClick(item)}>
				<item.icon class="h-5 w-5" />
			</button>
		</div>
	{/each}
</div>

<dialog class="modal" id={tzModalId}>
	<div class="modal-box flex h-fit max-h-[calc(100dvh-2rem)] flex-col overflow-hidden">
		<TimezoneSelect raw={tzRaw} inline onpick={() => closeModal(tzModalId)} />
		<div class="modal-action">
			<button class="btn btn-neutral btn-square w-full" onclick={() => closeModal(tzModalId)}>
				<X />
			</button>
		</div>
	</div>
</dialog>

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
