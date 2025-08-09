<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
</script>

<svelte:head>
	<title>Admin Dashboard | G.O.T Archive</title>
</svelte:head>

<div class="bg-primary-700 w-2/3">
	<div class="text-primary-50 font-bold">Hello, {data.session?.user?.email}</div>
</div>
