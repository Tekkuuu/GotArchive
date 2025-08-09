<script lang="ts">
	let { children }: { children?: any } = $props();
</script>

<footer
	class="bg-primary-50 dark:bg-primary-900 border-primary-900 dark:border-primary-50 sticky bottom-0 z-[9999] mt-2 flex w-full gap-1 border-t p-2"
>
	{@render children?.()}
</footer>
