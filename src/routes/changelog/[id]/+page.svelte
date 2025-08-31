<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';
	import { format } from 'date-fns';
	import { marked } from 'marked';

	let { data }: PageProps = $props();
	let changelog = $derived(data.changelogs.find((c) => c.changelogId === Number(page.params.id)));
</script>

<svelte:head>
	<title>Changelog | {changelog?.title ? changelog.title : ''} | G.O.T Archive</title>
	<meta
		name="description"
		content={`View the latest updates and changes for G.O.T Archive${changelog?.title ? ` – ${changelog.title}` : ''}. Stay informed about new features, improvements, and bug fixes.`}
	/>
</svelte:head>

{#if changelog}
	<div class="card bg-base-300 mx-auto my-auto w-3xl">
		<div class="card-body">
			<h1 class="card-title text-4xl font-bold">{changelog.title}</h1>
			<span class="mb-6 text-sm">
				{changelog.author} · {format(changelog.createdAt, 'yyyy-MM-dd, HH:mm')}
			</span>
			<section class="changelog-body prose">
				{@html marked.parse(changelog.content)}
			</section>
		</div>
	</div>
{/if}

<style>
	@reference "../../../app.css";

	:global(.changelog-body h1) {
		@apply mt-8 mb-2 pb-2 text-3xl font-bold;
	}
	:global(.changelog-body h2) {
		@apply mt-6 mb-2 pb-1 text-2xl font-bold;
	}
	:global(.changelog-body h3) {
		@apply mt-4 mb-1 text-xl font-semibold;
	}
	:global(.changelog-body ul) {
		@apply mb-4 list-disc pl-6;
	}
	:global(.changelog-body ol) {
		@apply mb-4 list-decimal pl-6;
	}
	:global(.changelog-body code) {
		@apply rounded px-2 py-1 font-mono text-sm;
	}
	:global(.changelog-body pre) {
		@apply mb-4 overflow-x-auto rounded p-3 font-mono text-sm;
	}
	:global(.changelog-body blockquote) {
		@apply mb-4 border-l-4 pl-4 italic;
	}
	:global(.changelog-body p) {
		@apply mb-4;
	}
	:global(.changelog-body hr) {
		@apply border-t;
	}
</style>
