<script lang="ts">
	import { twMerge } from 'tailwind-merge';

	interface Props {
		labelSide?: 'text-left' | 'text-right' | 'text-center';
		labelFor?: string;
		shape?: 'rect' | 'rounded' | 'pill';
		fulLWidth?: boolean;
		children?: any;
		appendClass?: string;
	}

	let {
		labelSide = 'text-center',
		labelFor,
		shape = 'rect',
		appendClass,
		children
	}: Props = $props();

	/**
	 * DARK MODE:
	 * primary-700 -> bg
	 * primary-50 -> text
	 */
	let dark = `
    dark:bg-primary-700
    dark:text-primary-50
  `;

	/**
	 * LIGHT MODE:
	 * primary-200 -> bg
	 * primary-900 -> text
	 */
	let light = `
    bg-primary-200
    text-primary-900
  `;
</script>

<label
	for={labelFor}
	class={twMerge(
		'flex min-h-10 flex-1 items-center justify-center transition-all duration-150',
		shape === 'rounded' && 'rounded-lg',
		shape === 'pill' && 'rounded-full',
		light,
		dark,
		labelSide,
		appendClass
	)}
>
	<span>{@render children?.()}</span>
</label>
