<script lang="ts">
	import { page } from '$app/state';
</script>

<div
	class={[
		'dark:text-primary-50 text-primary-900 dark:bg-primary-700 bg-primary-200',
		'mx-auto my-auto flex w-fit flex-col items-center rounded-xl border p-4 shadow-lg *:text-center',
		'dark:border-primary-600 border-primary-300 dark:shadow-primary-600 shadow-primary-300'
	]}
>
	<h1 class="text-9xl font-bold max-sm:text-6xl">Error</h1>
	<p class="mt-4">{page.error?.message || 'An unexpected error has occured.'}</p>
	<p class="mt-2">The issue has been reported and will be investigated.</p>
	<p class="mt-2">Sorry for the inconvenience.</p>
	<p class="mt-4">Error Code: <code>{page.error?.status || page.status}</code></p>
	{#if page.error?.sentryErrorId}
		<p class="mt-2">Error ID: <code>{page.error?.sentryErrorId}</code></p>
	{/if}
</div>
