<script lang="ts">
	let { children } = $props();
</script>

<tr class="dark:odd:bg-primary-800 odd:bg-primary-300">
	{@render children?.()}
</tr>
