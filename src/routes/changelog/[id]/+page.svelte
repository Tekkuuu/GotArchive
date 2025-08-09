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
	<div class="bg-primary-50 dark:bg-primary-900 mx-auto my-8 max-w-2xl rounded-lg p-6 shadow">
		<h1 class="text-primary-900 dark:text-primary-50 mb-2 text-4xl font-bold">{changelog.title}</h1>
		<span class="text-primary-700 dark:text-primary-300 mb-6 block text-sm">
			{changelog.author} · {format(changelog.createdAt, 'yyyy-MM-dd, HH:mm')}
		</span>
		<section class="changelog-body prose prose-primary dark:prose-invert">
			{@html marked.parse(changelog.content)}
		</section>
	</div>
{/if}

<style>
	@reference "../../../app.css";

	:global(.changelog-body h1) {
		@apply text-primary-900 dark:text-primary-50 mt-8 mb-2 pb-2 text-3xl font-bold;
	}
	:global(.changelog-body h2) {
		@apply text-primary-800 dark:text-primary-100 mt-6 mb-2 pb-1 text-2xl font-bold;
	}
	:global(.changelog-body h3) {
		@apply text-primary-700 dark:text-primary-200 mt-4 mb-1 text-xl font-semibold;
	}
	:global(.changelog-body ul) {
		@apply text-primary-800 dark:text-primary-100 mb-4 list-disc pl-6;
	}
	:global(.changelog-body ol) {
		@apply text-primary-800 dark:text-primary-100 mb-4 list-decimal pl-6;
	}
	:global(.changelog-body code) {
		@apply bg-primary-100 dark:bg-primary-800 text-primary-900 dark:text-primary-50 rounded px-2 py-1 font-mono text-sm;
	}
	:global(.changelog-body pre) {
		@apply bg-primary-100 dark:bg-primary-800 text-primary-900 dark:text-primary-50 mb-4 overflow-x-auto rounded p-3 font-mono text-sm;
	}
	:global(.changelog-body blockquote) {
		@apply border-primary-400 text-primary-700 dark:text-primary-300 mb-4 border-l-4 pl-4 italic;
	}
	:global(.changelog-body p) {
		@apply text-primary-900 dark:text-primary-50 mb-4;
	}
	:global(.changelog-body hr) {
		@apply border-primary-300 dark:border-primary-600 border-t;
	}
</style>
