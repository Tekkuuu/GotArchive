<script lang="ts">
	import { sineInOut } from 'svelte/easing';
	import { slide } from 'svelte/transition';
	import { onMount, getContext } from 'svelte';

	interface Props {
		children?: any;
		trigger: string;
	}

	let { children, trigger }: Props = $props();
	let open = $state(false);
	let element: HTMLElement;

	const handleTrigger = () => {
		open = !open;

		// Close other navbar dropdowns
		context.forEach((ctx) => {
			if (ctx.trigger !== trigger) {
				ctx.action();
			}
		});
	};

	const context = getContext<Array<{ trigger: string; action: () => void }>>('nav-dropdowns') ?? [];

	onMount(() => {
		const entry = {
			trigger,
			action: () => (open = false)
		};
		context.push(entry);

		const triggers = document.querySelectorAll<HTMLElement>(trigger);
		for (let t of triggers) {
			t.addEventListener('click', handleTrigger);
		}

		return () => {
			// Remove this dropdown from context
			const index = context.indexOf(entry);
			if (index !== -1) context.splice(index, 1);

			// Remove event listeners for this dropdown
			for (let t of triggers) {
				t.removeEventListener('click', handleTrigger);
			}
		};
	});
</script>

<ul bind:this={element} class="absolute top-[200%] z-50 flex text-nowrap">
	{#if open}
		<div
			transition:slide={{ axis: 'y', duration: 75, easing: sineInOut }}
			class="
        bg-primary-50 dark:bg-primary-900
        border-primary-900 dark:border-primary-50
        flex flex-col gap-1 rounded-xl border
      "
		>
			{@render children?.()}
		</div>
	{/if}
</ul>
