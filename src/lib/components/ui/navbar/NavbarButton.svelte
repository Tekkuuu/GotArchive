<script lang="ts">
	interface Props {
		children?: any;
		onclick: (event: MouseEvent) => void;
	}

	let { children, onclick }: Props = $props();
</script>

<li>
	<button
		{onclick}
		class="
    dark:text-primary-400 text-primary-600 hover:text-primary-900 dark:hover:text-primary-50
    flex flex-1 gap-1 p-2
    font-bold text-nowrap transition-all duration-150 hover:cursor-pointer
  "
	>
		{@render children?.()}
	</button>
</li>
