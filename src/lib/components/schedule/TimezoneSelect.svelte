<script lang="ts">
	import { browser } from '$app/environment';
	import { ChevronDown, Globe } from 'lucide-svelte';
	import {
		DEFAULT_TIME_ZONE,
		TIME_ZONE_OPTIONS,
		browserTimeZone,
		tzAbbreviation
	} from '$lib/api/schedule/datecode';
	import { getTimeZoneStore, resolveTimeZone, setTimeZone } from '$lib/stores';

	interface Props {
		/** Raw `tz` query value (null = use persisted choice). */
		raw: string | null;
		/** Compact icon-only rendering for navbars. */
		compact?: boolean;
		/** Render the zone list inline, filling the available height (no dropdown). */
		inline?: boolean;
		/** Called after a zone is picked (e.g. to close a containing dialog). */
		onpick?: () => void;
	}

	let { raw, compact = false, inline = false, onpick }: Props = $props();

	const tzStore = getTimeZoneStore();
	const browserZone = $derived(browser ? browserTimeZone() : null);
	/** True when no explicit `?tz=` param is set (the persisted store wins). */
	const isAuto = $derived(!raw?.trim());
	const autoLabel = $derived(browserZone ? `Auto (${browserZone})` : 'Auto (browser timezone)');
	const effective = $derived(
		raw?.trim() ? (resolveTimeZone(raw) ?? DEFAULT_TIME_ZONE) : (tzStore.value ?? DEFAULT_TIME_ZONE)
	);
	const shortLabel = $derived(tzAbbreviation(effective) ?? effective);

	function pick(value: string): void {
		setTimeZone(value === 'auto' ? null : value);
		if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}
		onpick?.();
	}
</script>

{#snippet options()}
	<li>
		<button type="button" class:menu-active={isAuto} onclick={() => pick('auto')}
			>{autoLabel}</button
		>
	</li>
	{#each TIME_ZONE_OPTIONS as zone}
		<li>
			<button type="button" class:menu-active={raw === zone} onclick={() => pick(zone)}>
				{zone.replace('_', ' ')}
			</button>
		</li>
	{/each}
{/snippet}

{#if inline}
	<div class="flex min-h-0 flex-1 flex-col">
		<ul
			tabindex="0"
			role="menu"
			aria-label="Display timezone options"
			class="menu w-full flex-1 flex-nowrap overflow-y-auto p-0"
		>
			{@render options()}
		</ul>
	</div>
{:else}
	<div class="dropdown dropdown-end {compact ? '' : 'w-full max-w-64 flex-1'}">
		{#if compact}
			<button
				tabindex="0"
				type="button"
				class="btn btn-ghost gap-1"
				title="Display timezone ({effective.replace('_', ' ')})"
				aria-label="Display timezone"
			>
				<Globe class="shrink-0" />
				<span class="font-bold">{shortLabel}</span>
				<ChevronDown class="text-base-content/50 size-3.5" />
			</button>
		{:else}
			<button
				tabindex="0"
				type="button"
				class="btn btn-sm btn-outline flex w-full items-center justify-between gap-2"
				aria-label="Display timezone"
			>
				<span class="text-base-content/70 font-semibold">Display times in</span>
				<span class="flex items-center gap-1 font-bold">
					{effective.replace('_', ' ')}
					<ChevronDown class="text-base-content/50 size-3.5" />
				</span>
			</button>
		{/if}
		<ul
			tabindex="0"
			role="menu"
			aria-label="Display timezone options"
			class="dropdown-content menu bg-base-200 rounded-box z-10 max-h-80 w-64 flex-nowrap overflow-y-auto p-2 shadow-xl"
		>
			{@render options()}
		</ul>
	</div>
{/if}
