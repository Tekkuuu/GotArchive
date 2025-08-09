<script lang="ts">
	import { onMount, getContext } from 'svelte';

	interface Props {
		children?: any;
		value: string | number;
	}

	let { children, value }: Props = $props();
	let index: number = $state(0);

	let style = {
		item: 'flex items-center justify-center p-2'
	};

	let dark = {
		item: 'dark:text-primary-200',
		disabled: 'dark:text-primary-500'
	};

	let light = {
		item: 'text-primary-700',
		disabled: 'text-primary-600'
	};

	const { registerItem, setSelected, disabled } = getContext<{
		registerItem: (value: any) => number;
		setSelected: (value: any) => void;
		disabled: boolean;
		getSelected: () => number;
	}>('tab-selector');

	onMount(() => {
		index = registerItem(value);
	});
</script>

<button
	class={[style.item, disabled ? [dark.disabled, light.disabled] : [dark.item, light.item]]}
	onclick={(e) => {
		e.preventDefault();
		setSelected(index);
	}}
>
	{@render children?.()}
</button>
