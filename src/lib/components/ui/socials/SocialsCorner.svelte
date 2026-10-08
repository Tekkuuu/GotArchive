<script lang="ts">
	import { MediaQuery } from 'svelte/reactivity';
	import { PlatformBadge } from '$lib/components/anime';

	export interface SocialPlatform {
		platformId: string;
		name: string;
		url: string;
		iconSvg: string | null;
		iconColor: string | null;
	}

	interface Props {
		platforms: SocialPlatform[];
	}

	let { platforms }: Props = $props();

	const mqNoHover = new MediaQuery('(hover: none)');

	/** Expanded pill (lg+ rail only). Desktop: hover/focus. Touch: first tap, second navigates. */
	let expanded: string | null = $state(null);

	/**
	 * Short label for the expanding pill.
	 * @param name - Raw DB name.
	 * @returns Short display name.
	 */
	function shortName(name: string): string {
		const lower = name.toLowerCase();
		if (lower.includes('games')) return 'GOT Games';
		if (lower.includes('extra')) return 'GOT Extra';
		if (lower.includes('youtube')) return 'YouTube';
		if (lower.includes('patreon')) return 'Patreon';
		if (lower.includes('twitch')) return 'Twitch';
		if (lower.includes('rumble')) return 'Rumble';
		if (lower.includes('kick')) return 'Kick';
		return name;
	}

	/**
	 * Touch handler: expand on first tap, follow link on second.
	 * @param event - Click event.
	 * @param platformId - Tapped platform.
	 */
	function handleTap(event: MouseEvent, platformId: string) {
		if (!mqNoHover.current) return;
		if (expanded !== platformId) {
			event.preventDefault();
			expanded = platformId;
		}
	}

	/**
	 * Hover/focus expansion, desktop only (touch has sticky hover).
	 * @param platformId - Entered platform, or null on leave.
	 */
	function handleHover(platformId: string | null) {
		if (mqNoHover.current) return;
		expanded = platformId;
	}
</script>

{#if platforms.length > 0}
	{#if expanded && mqNoHover.current}
		<button
			type="button"
			class="socials-backdrop"
			aria-label="Close socials"
			onclick={() => (expanded = null)}
		></button>
	{/if}
	<aside class="socials" role="region" aria-label="Socials">
		{#each platforms as platform (platform.platformId)}
			{@const isOpen = expanded === platform.platformId}
			<a
				href={platform.url}
				target="_blank"
				rel="noopener noreferrer"
				title={platform.name}
				aria-label={platform.name}
				class="socials-pill {isOpen ? 'socials-pill--open' : ''}"
				onclick={(e) => handleTap(e, platform.platformId)}
				onmouseenter={() => handleHover(platform.platformId)}
				onmouseleave={() => handleHover(null)}
				onfocus={() => handleHover(platform.platformId)}
				onblur={() => handleHover(null)}
			>
				<span class="block size-5 shrink-0">
					<PlatformBadge
						name={platform.name}
						iconSvg={platform.iconSvg}
						iconColor={platform.iconColor}
					/>
				</span>
				<span class="socials-pill-label">{shortName(platform.name)}</span>
			</a>
		{/each}
	</aside>
{/if}

<style>
	/* Mobile / tablet: in-flow centered row of icon-only pills. */
	.socials {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
	}
	.socials-pill {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 2.25rem;
		width: 2.25rem;
		border-radius: 9999px;
		background-color: var(--color-zinc-50, #fafafa);
		box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
		transition:
			transform 150ms ease,
			border-radius 200ms ease;
	}
	.socials-pill:hover {
		transform: scale(1.05);
	}
	.socials-pill-label {
		display: none;
	}

	/* Backdrop is only used by the lg+ touch-expand behavior. */
	.socials-backdrop {
		display: none;
	}

	/* lg+: fixed left-centered rail, expands on hover/focus/tap like before. */
	@media (min-width: 1024px) {
		.socials-backdrop {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 30;
			cursor: default;
		}
		.socials {
			position: fixed;
			top: 50%;
			left: 0;
			z-index: 40;
			transform: translateY(-50%);
			flex-direction: column;
			flex-wrap: nowrap;
			align-items: flex-start;
			gap: 0.5rem;
		}
		.socials-pill {
			width: auto;
			height: auto;
			border-radius: 0 9999px 9999px 0;
			padding: 0.5rem;
			background-color: var(--color-zinc-50, #fafafa);
		}
		.socials-pill:hover {
			transform: none;
			padding-right: 1rem;
		}
		.socials-pill-label {
			display: block;
			min-width: 0;
			max-width: 0;
			margin-left: 0;
			overflow: hidden;
			font-size: 0.875rem;
			font-weight: 700;
			white-space: nowrap;
			color: var(--color-zinc-900, #18181b);
			opacity: 0;
			transition:
				max-width 200ms ease,
				margin-left 200ms ease,
				opacity 200ms ease;
		}
		.socials-pill--open .socials-pill-label {
			max-width: 10rem;
			margin-left: 0.5rem;
			opacity: 1;
		}
	}
</style>
