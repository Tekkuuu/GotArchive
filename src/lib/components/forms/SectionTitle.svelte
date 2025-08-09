<script lang="ts">
	import type { ClassValue } from 'svelte/elements';

	interface Props {
		shape?: 'rect' | 'rounded' | 'pill';
		fontWeight?: '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
		appendClass?: ClassValue;
		children?: any;
	}

	let { shape = 'rect', fontWeight = '400', appendClass, children }: Props = $props();

	const getFontWeight = () => {
		switch (fontWeight) {
			case '100':
				return 'font-thin';
			case '200':
				return 'font-extralight';
			case '300':
				return 'font-light';
			case '400':
				return 'font-normal';
			case '500':
				return 'font-medium';
			case '600':
				return 'font-semibold';
			case '700':
				return 'font-bold';
			case '800':
				return 'font-extrabold';
			case '900':
				return 'font-black';
			default:
				return 'font-normal';
		}
	};
</script>

<div
	class={[
		'flex min-h-10 w-full items-center justify-center',
		'dark:bg-primary-700 bg-primary-200 text-primary-900 dark:text-primary-50',
		shape === 'rounded' && 'rounded-lg',
		shape === 'pill' && 'rounded-full',
		appendClass
	]}
>
	<span class={['text-xl', getFontWeight()]}>{@render children?.()}</span>
</div>
