<script lang="ts">
	type BaseProps = {
		children?: any;
		onclick?: (e: MouseEvent) => void;
		id?: string;
	};

	type LinkProps = BaseProps & {
		href: string;
		target?: '_blank' | '_self' | '_parent' | '_top';
	};

	type DivProps = BaseProps & {
		href?: never;
		target?: never;
	};

	type Props = LinkProps | DivProps;

	let { href, target, children, onclick, id }: Props = $props();
</script>

<li class="flex flex-col items-stretch justify-center p-2 lg:flex-row lg:items-center" {id}>
	<svelte:element
		this={href ? 'a' : 'div'}
		{href}
		{target}
		class="
      text-primary-500 hover:text-primary-900 dark:hover:text-primary-50 dark:text-primary-400
      relative flex flex-1 cursor-pointer items-center justify-start gap-1 font-bold lg:justify-center
    "
		{onclick}
		role={href ? 'link' : 'button'}
		tabindex="0"
	>
		{@render children?.()}
	</svelte:element>
</li>
