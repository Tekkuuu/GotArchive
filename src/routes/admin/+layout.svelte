<script lang="ts">
	let { data, children } = $props();
	let { supabase } = $derived(data);
</script>

<div>
	{@render children?.()}
</div>
