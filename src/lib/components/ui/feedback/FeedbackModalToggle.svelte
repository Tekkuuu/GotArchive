<script lang="ts">
	interface Props {
		open: boolean;
	}

	let { open = $bindable() }: Props = $props();
</script>

<div class="">
	<button
		class={[
			'border-primary-900 dark:border-primary-50 border',
			'relative flex h-12 items-center justify-center rounded-full px-2 transition-all duration-150',
			open ? 'dark:bg-primary-50 bg-primary-900' : 'dark:bg-primary-900 bg-primary-50'
		]}
		onclick={() => (open = !open)}
	>
		<span
			class={[
				'transition-all duration-150',
				open ? 'text-primary-50 dark:text-primary-900' : 'text-primary-900 dark:text-primary-50'
			]}>Feedback</span
		>
	</button>
</div>
