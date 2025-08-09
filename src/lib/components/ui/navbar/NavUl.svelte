<script lang="ts">
	let { children } = $props();
</script>

<ul
	class="flex w-full flex-col items-stretch justify-start gap-1 lg:flex-row lg:items-center lg:justify-center"
>
	{@render children?.()}
</ul>
