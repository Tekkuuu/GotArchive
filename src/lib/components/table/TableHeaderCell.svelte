<script lang="ts">
	let { children } = $props();
</script>

<th class="border-primary-400 border-r-2 p-2 first:w-max last:border-r-0">
	{@render children?.()}
</th>
