<script lang="ts">
</script>

<div
	class="text-primary-50 dark:bg-primary-700 bg-primary-200 flex h-full w-full items-center justify-center gap-1 rounded-lg p-2"
>
	{#each Array(8) as _, index (index)}
		<div
			class="bg-primary-900 dark:bg-primary-50 animate-wiggle h-2 w-2 rounded-full"
			style="animation-delay: {index * 0.1}s"
		></div>
	{/each}
</div>
