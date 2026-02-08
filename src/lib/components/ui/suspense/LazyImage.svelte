<script lang="ts">
	interface Props {
		/** Primary image source (low-res, loads first) */
		primary?: string;
		/** Secondary image source (high-res, loads after primary) */
		secondary?: string;
		alt: string;
		class?: string;
		fallbackClass?: string;
	}

	let { primary, secondary, alt, class: className = '', fallbackClass = '' }: Props = $props();

	let primaryLoaded = $state(false);
	let secondaryLoaded = $state(false);
	let error = $state(false);

	// Determine which mode to use - check for non-empty strings
	const hasPrimary = $derived(!!primary && primary.trim() !== '');
	const hasSecondary = $derived(!!secondary && secondary.trim() !== '');
	const hasBothImages = $derived(hasPrimary && hasSecondary);
</script>

{#if error}
	<!-- Error state -->
	<div class="{fallbackClass || className} bg-base-300 flex items-center justify-center">
		<span class="text-xs opacity-50">Failed to load</span>
	</div>
{:else if hasBothImages}
	<!-- Two-stage progressive loading -->
	{#if !secondaryLoaded}
		<img
			loading="lazy"
			alt={alt}
			src={primary}
			onload={() => (primaryLoaded = true)}
			onerror={() => (error = true)}
			class={className}
		/>
	{/if}
	{#if primaryLoaded}
		<img
			loading="lazy"
			class="{className} transition-opacity {secondaryLoaded ? 'opacity-100' : 'absolute opacity-0'}"
			src={secondary}
			alt={alt}
			onload={() => (secondaryLoaded = true)}
			onerror={() => (error = true)}
		/>
	{/if}
{:else if hasPrimary || hasSecondary}
	<!-- Single image with lazy loading -->
	{@const source = hasPrimary ? primary : secondary}
	{#if !primaryLoaded}
		<div class="{fallbackClass || className} bg-base-300 animate-pulse"></div>
	{/if}

	<img
		{alt}
		src={source}
		class={className}
		loading="lazy"
		onload={() => (primaryLoaded = true)}
		onerror={() => (error = true)}
		style:display={primaryLoaded ? 'block' : 'none'}
	/>
{:else}
	<!-- No valid image source provided -->
	<div class="{fallbackClass || className} bg-base-300 flex items-center justify-center">
		<span class="text-xs opacity-50">No image</span>
	</div>
{/if}
