<script lang="ts">
	import type { PageProps } from './$types';
	import { format } from 'date-fns';
	import { marked } from 'marked';
	import { LinkButton } from '$lib/components/forms/';
	import _ from 'lodash';

	let { data }: PageProps = $props();
	let changelogs = $derived(_.orderBy(data.changelogs, ['createdAt'], ['desc']));
</script>

<svelte:head>
	<title>Changelog | G.O.T Archive</title>
	<meta
		name="description"
		content="Latest updates and changes to the G.O.T Archive, including new features, bug fixes, and improvements."
	/>
</svelte:head>

{#snippet entry(changelog: (typeof changelogs)[number])}
	<div class="text-primary-900 dark:text-primary-50 border-accent-400 border-b">
		<h1 class="text-4xl font-bold">{changelog.title}</h1>
		<div class="text-primary-700 dark:text-primary-300 mb-2 text-base">
			{changelog.author} · {format(changelog.createdAt, 'yyyy-MM-dd, HH:mm')}
		</div>
		<div class="relative flex max-h-40 flex-col overflow-hidden rounded-lg">
			<div class="changelog-body">
				{@html marked.parse(changelog.content)}
			</div>
			<div
				class="from-primary-50 dark:from-primary-900 pointer-events-none absolute bottom-0 left-0 h-full w-full bg-gradient-to-t to-transparent"
			></div>
			<div class="absolute bottom-0 left-0 flex w-full justify-end p-2">
				<LinkButton
					href={`/changelog/${changelog.changelogId}`}
					variant="warning"
					shape="rounded"
					filled
				>
					<span class="font-bold">Read more</span>
				</LinkButton>
			</div>
		</div>
	</div>
{/snippet}

<div class="grid grid-cols-1 gap-6 px-2 md:grid-cols-2">
	{#each changelogs as c}
		{@render entry(c)}
	{/each}
</div>

<style>
	@reference "../../app.css";

	:global(.changelog-body h1) {
		@apply border-primary-100 dark:border-primary-700 text-primary-900 dark:text-primary-50 mt-8 mb-2 border-b pb-2 text-3xl font-bold;
	}
	:global(.changelog-body h2) {
		@apply border-primary-100 dark:border-primary-700 text-primary-800 dark:text-primary-100 mt-6 mb-2 border-b pb-1 text-2xl font-bold;
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
