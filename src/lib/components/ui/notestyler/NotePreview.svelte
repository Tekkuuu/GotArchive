<script lang="ts">
	interface Props {
		html: string;
	}

	let { html = '' }: Props = $props();

	const hasContent = $derived((html ?? '').trim().length > 0);
</script>

<div class="text-wrap whitespace-pre-wrap">
	{#if hasContent}
		<!-- eslint-disable-next-line svelte/no-at-html-tags -- schedule notes are admin-authored and sanitized before public display -->
		{@html html}
	{:else}
		<span class="text-base-content/40 italic">Nothing to preview yet</span>
	{/if}
</div>
