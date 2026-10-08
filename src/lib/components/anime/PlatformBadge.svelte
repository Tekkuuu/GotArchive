<script lang="ts">
	import PlatformIcon from './PlatformIcon.svelte';
	import GotGamesLogo from '$lib/assets/gotgames.png';
	import GotExtraLogo from '$lib/assets/gotextra.png';

	/**
	 * Single platform icon (content only — caller provides box/link).
	 * Uses the DB `icon_svg`, with the bundled GOT channel PNGs matched by name.
	 */
	interface Props {
		name: string;
		iconSvg?: string | null;
		iconColor?: string | null;
		class?: string;
	}

	let { name, iconSvg = null, iconColor = null, class: className = 'size-full' }: Props = $props();
</script>

{#if name.toLowerCase().includes('games')}
	<img src={GotGamesLogo} alt="GOT Games" class="max-h-full max-w-full" />
{:else if name.toLowerCase().includes('extra')}
	<img src={GotExtraLogo} alt="GOT Extra" class="max-h-full max-w-full" />
{:else if iconSvg}
	<PlatformIcon svg={iconSvg} color={iconColor} class={className} />
{/if}
