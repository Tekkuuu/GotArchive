<script lang="ts">
	let { data, children } = $props();
	let { supabase } = $derived(data);
</script>

<div class="mr-2 ml-2">
	{@render children?.()}
</div>
