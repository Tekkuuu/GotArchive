<script lang="ts">
	import Toast from './Toast.svelte';
	import { toaster } from './toast-state';
</script>

<div class="toast toast-center toast-top z-50 w-full md:w-1/2">
	{#each $toaster.reverse() as toast, i (toast.id)}
		<Toast {toast} index={i} />
	{/each}
</div>
