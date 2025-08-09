<script lang="ts">
	import { scale, slide } from 'svelte/transition';
	import { sineIn, sineInOut, sineOut } from 'svelte/easing';
	import { AlignJustify, X } from 'lucide-svelte';
	import { setContext } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';

	let { children } = $props();
	let dropdowns: Array<{ trigger: string; action: () => void }> = $state([]);
	let open: boolean = $state(false);

	const isMobile = new MediaQuery('(max-width: 63.999rem)');

	$effect(() => {
		if (!isMobile.current) {
			open = false;
		}
	});

	setContext('nav-dropdowns', dropdowns);
	setContext('nav-style', () => (isMobile.current ? 'vertical' : 'horizontal'));
</script>

<!-- The persistent top bar. z-50 makes it the top-most element. -->
<nav
	class={[
		'bg-primary-50 dark:bg-primary-900 border-b-primary-900 dark:border-b-primary-50',
		'sticky top-0 z-50 flex h-14 items-center justify-between border-b p-2',
		'lg:justify-center lg:gap-5'
	]}
>
	<!-- Desktop navigation links -->
	<div class="hidden lg:flex lg:items-center lg:gap-5">
		{@render children?.()}
	</div>

	<!-- 
    The toggle button is back in the nav bar.
    It will stay in place while the panel slides in underneath.
  -->
	<div class="h-10 lg:hidden">
		<button onclick={() => (open = !open)} class="dark:text-primary-50 text-primary-900 h-10 p-2">
			{#if open}
				<span
					in:scale={{ delay: 75, easing: sineOut, duration: 75 }}
					out:scale={{ easing: sineIn, duration: 75 }}
					class="*:h-6"
				>
					<X />
				</span>
			{:else}
				<span
					in:scale={{ delay: 75, easing: sineOut, duration: 75 }}
					out:scale={{ easing: sineIn, duration: 75 }}
					class="*:h-6"
				>
					<AlignJustify />
				</span>
			{/if}
		</button>
	</div>
</nav>

<!-- Sidebar for mobile -->
{#if open && isMobile.current}
	<!-- Overlay. z-40 is below the nav bar. -->
	<div
		onclick={() => (open = false)}
		class="fixed inset-0 z-40 bg-black/50"
		aria-hidden="true"
	></div>

	<!-- 
    Sidebar Panel.
    CRITICAL CHANGE: z-index is now z-40, so it slides UNDER the nav bar (z-50).
    I also added padding-top to push the content below the nav bar.
  -->
	<div
		transition:slide={{ axis: 'x', easing: sineInOut, duration: 200 }}
		class="bg-primary-50 dark:bg-primary-900 fixed top-0 left-0 z-40 flex h-full w-64 flex-col gap-4 p-4 pt-16"
	>
		<!-- Mobile navigation links -->
		<div class="flex flex-col items-start gap-2">
			{@render children?.()}
		</div>
	</div>
{/if}
