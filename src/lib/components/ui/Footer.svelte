<script lang="ts">
	let { children }: { children?: any } = $props();
</script>

<footer
	class="bg-primary-50 dark:bg-primary-900 border-primary-900 dark:border-primary-50 sticky bottom-0 mt-2 flex w-full border-t p-2 gap-1"
>
	{@render children?.()}
</footer>
