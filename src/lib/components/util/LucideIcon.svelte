<script lang="ts">
	import type { Icon } from 'lucide-svelte';

	interface Props {
		icon: typeof Icon;
		shape?: 'square';
	}

	let { icon, shape = 'square' }: Props = $props();
</script>

<span class={['flex items-center', shape === 'square' && 'aspect-square']}>
	{#if icon}
		{@const LucideIcon = icon}
		<LucideIcon class="m-auto" />
	{/if}
</span>
