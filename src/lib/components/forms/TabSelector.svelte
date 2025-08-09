<script lang="ts">
	import { onMount, setContext } from 'svelte';
	import { localStore } from '$lib/stores/localStore.svelte';

	interface Props {
		selected: string | number;
		disabled?: boolean;
		children?: any;
		saveLocal?: string;
	}

	let { selected = $bindable(), disabled = false, children, saveLocal }: Props = $props();

	let container: HTMLDivElement;
	let itemWidth = $state(0);
	let selectedIndex: number = $state(0);

	let save = localStore<{ id: string; value: string | number }[]>('tabSelectors', []);

	let items: { value: any; index: number }[] = $state([]);

	let style = {
		container: 'border relative',
		disabled: 'pointer-events-none',
		slider: 'absolute top-0 left-0 -z-10 h-full transition-transform duration-150'
	};

	let dark = {
		container: 'dark:border-primary-700',
		disabled: 'dark:bg-primary-600',
		slider: 'dark:bg-primary-700'
	};

	let light = {
		container: 'border-primary-200',
		disabled: 'bg-primary-400',
		slider: 'bg-primary-200'
	};

	const registerItem = (value: any) => {
		const index = items.length;
		items.push({ value, index });
		return index;
	};

	const setSelected = (index: number) => {
		selected = items.find((x) => x.index === index)?.value;
		selectedIndex = index;
		if (saveLocal) {
			const id = save.value.findIndex((x) => x.id === saveLocal);
			if (id === -1) {
				save.update((current) => [...current, { id: saveLocal, value: selected }]);
			} else {
				save.value[id].value = selected;
			}
		}
	};

	onMount(() => {
		if (saveLocal) {
			const saved = save.value.find((x) => x.id === saveLocal);
			const item = items.find((x) => x.value === saved?.value);
			if (item) {
				setSelected(item.index);
			}
		}

		// measure item width after mount
		const updateItemWidth = () => {
			if (container) {
				itemWidth = container.offsetWidth / items.length;
			}
		};

		// Update slider width
		updateItemWidth();
		window.addEventListener('resize', updateItemWidth);

		return () => {
			window.removeEventListener('resize', updateItemWidth);
		};
	});

	setContext('tab-selector', {
		registerItem,
		setSelected,
		disabled
	});
</script>

<div
	class={[style.container, disabled && style.disabled, dark.container, light.container]}
	bind:this={container}
>
	<div
		class={[style.slider, disabled ? [dark.disabled, light.disabled] : [dark.slider, light.slider]]}
		style="width: {itemWidth}px; transform: translateX({selectedIndex * itemWidth}px);"
	></div>
	<div class="grid auto-cols-fr grid-flow-col gap-1">
		{@render children?.()}
	</div>
</div>
