<script lang="ts">
	import { Sun, Moon } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { getDarkModeStore } from '$lib/stores/';
	import { sineInOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';

	let saveState = getDarkModeStore();
	let isDarkMode = $derived(saveState.value);

	// Apply the saved theme as soon as possible
	$effect(() => {
		// If the state is saved as true, use dark mode
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
	});

	// Toggle the dark mode state and save it
	function toggleDarkMode() {
		if (document.documentElement.classList.contains('dark')) {
			document.documentElement.classList.remove('dark');
			saveState.update((_) => false);
		} else {
			document.documentElement.classList.add('dark');
			saveState.update((_) => true);
		}
	}
</script>

<div class="">
	<button
		class="
      bg-primary-50 dark:bg-primary-900
      border-primary-900 dark:border-primary-50
      relative flex h-12 w-12
      items-center justify-center
      rounded-full border
    "
		onclick={() => toggleDarkMode()}
	>
		{#if isDarkMode}
			<div
				class="absolute flex flex-1 items-center justify-center"
				in:scale={{ delay: 75, duration: 75, easing: sineInOut }}
				out:scale={{ duration: 75, easing: sineInOut }}
			>
				<Moon color="var(--color-primary-50)" />
			</div>
		{:else}
			<div
				class="absolute flex flex-1 items-center justify-center"
				in:scale={{ delay: 75, duration: 75, easing: sineInOut }}
				out:scale={{ duration: 75, easing: sineInOut }}
			>
				<Sun color="var(--color-primary-900)" />
			</div>
		{/if}
	</button>
</div>
