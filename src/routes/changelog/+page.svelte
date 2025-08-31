<script lang="ts">
	import type { PageProps } from './$types';
	import { format } from 'date-fns';
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
	<div class="card bg-base-300 border-primary items-center border">
		<div class="card-body w-full items-center">
			<h1 class="card-title text-4xl font-bold">{changelog.title}</h1>
			<p class="mb-2 text-base">
				{changelog.author} · {format(changelog.createdAt, 'yyyy-MM-dd, HH:mm')}
			</p>
			<div class="card-actions w-full">
				<a href={`/changelog/${changelog.changelogId}`} class="btn btn-primary btn-block">
					<span class="font-bold">Read more</span>
				</a>
			</div>
		</div>
	</div>
{/snippet}

<div class="grid grid-cols-1 gap-6 px-2 md:grid-cols-2">
	{#each changelogs as c}
		{@render entry(c)}
	{/each}
</div>
