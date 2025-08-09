<script lang="ts">
	import Toast from './Toast.svelte';
	import { toaster } from './toast-state';
</script>

<div class="pointer-events-none fixed top-0 left-0 z-50 h-screen w-screen p-2">
	<div class="relative h-full w-full">
		{#each $toaster.slice(-4).reverse() as toast, i (toast.id)}
			<Toast {toast} index={i} />
		{/each}
	</div>
</div>
