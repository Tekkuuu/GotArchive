<script lang="ts">
	interface Props {
		children?: any;
		href?: string;
		type?: 'pill' | 'plain';
	}

	let { children, href, type = 'plain' } = $props();
</script>

<li>
	<a
		{href}
		class="
      dark:text-primary-400 text-primary-600 hover:text-primary-900 dark:hover:text-primary-50
      flex flex-1 gap-1 p-2
      font-bold text-nowrap transition-all duration-150 hover:cursor-pointer
    "
	>
		{@render children?.()}
	</a>
</li>
