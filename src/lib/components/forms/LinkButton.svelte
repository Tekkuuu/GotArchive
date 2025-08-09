<script lang="ts">
	import { twMerge } from 'tailwind-merge';
	import _ from 'lodash';
	import type { ClassValue } from 'svelte/elements';

	type Variant = 'submit' | 'warning' | 'danger' | 'info' | 'default';
	type Shape = 'rect' | 'pill' | 'circle' | 'rounded';

	interface Props {
		children?: any;
		appendClass?: ClassValue;
		variant?: Variant;
		shape?: Shape;
		filled?: boolean;
		fullWidth?: boolean;
		disabled?: boolean;
		href?: string;
		target?: '_blank' | '_self' | '_parent' | '_top' | string;
	}

	let {
		children,
		appendClass,
		filled = false,
		fullWidth = false,
		variant = 'default',
		shape = 'rect',
		disabled = false,
		href,
		target = '_self'
	}: Props = $props();

	// Base styles for each variant
	const baseVariants: Record<string, string[]> = {
		submit: [
			'border-success hover:bg-success-light active:bg-success-light',
			'bg-transparent text-success hover:bg-success hover:text-primary-900 active:bg-success-light active:border-success-light'
		],
		warning: [
			'border-warning hover:bg-warning-light active:bg-warning-light',
			'bg-transparent text-warning hover:bg-warning hover:text-primary-900 active:bg-warning-light active:border-warning-light'
		],
		danger: [
			'border-danger hover:bg-danger-light active:bg-danger-light',
			'bg-transparent text-danger hover:bg-danger hover:text-primary-900 active:bg-danger-light active:border-danger-light'
		],
		info: [
			'border-info hover:bg-info-light active:bg-info-light',
			'bg-transparent text-info hover:bg-info hover:text-primary-900 active:bg-info-light active:border-info-light'
		],
		default: [
			'border-primary-200 hover:bg-primary-400 active:bg-primary-200',
			'dark:border-primary-700 dark:hover:bg-primary-700 dark:active:bg-primary-700',
			'bg-transparent text-primary-200 hover:bg-primary-200 hover:text-primary-900 active:bg-primary-300 active:border-primary-300',
			'dark:bg-transparent dark:text-primary-700 dark:hover:bg-primary-700 dark:hover:text-primary-900 dark:active:bg-primary-800 dark:active:border-primary-800'
		]
	};

	// Filled styles for each variant
	const filledVariants: Record<string, string[]> = {
		submit: [
			'bg-success border-success text-primary-900 hover:bg-success-light hover:border-success-light active:bg-success active:border-success'
		],
		warning: [
			'bg-warning border-warning text-primary-900 hover:bg-warning-light hover:border-warning-light active:bg-warning active:border-warning'
		],
		danger: [
			'bg-danger border-danger text-primary-900 hover:bg-danger-light hover:border-danger-light active:bg-danger active:border-danger'
		],
		info: [
			'bg-info border-info text-primary-900 hover:bg-info-light hover:border-info-light active:bg-info active:border-info'
		],
		default: [
			'bg-primary-200 border-primary-200 text-primary-900 hover:bg-primary-300 hover:border-primary-300 active:bg-primary-200 active:border-primary-200',
			'dark:bg-primary-700 dark:border-primary-700 dark:text-primary-900 dark:hover:bg-primary-800 dark:hover:border-primary-800 dark:active:bg-primary-700 dark:active:border-primary-700'
		]
	};

	// Final variant styles (base + filled)
	let variantClasses = $state(filled ? filledVariants[variant] : baseVariants[variant]);
	$effect(() => {
		variantClasses = filled ? filledVariants[variant] : baseVariants[variant];
	});

	const shapeClasses = {
		rect: 'rounded-none',
		circle: 'aspect-square rounded-full',
		rounded: 'rounded-lg',
		pill: 'rounded-full'
	}[shape];

	const disabledClasses = [
		'bg-primary-300 dark:bg-primary-800',
		'border-primary-300 dark:border-primary-800',
		'*:text-primary-400 dark:*:text-primary-700',
		'*:fill-primary-400 dark:*:fill-primary-700',
		'pointer-events-none'
	];
</script>

<!--
@component LinkButton
-->
<a
	{href}
	{target}
	class={twMerge(
		[
			'inline-flex cursor-pointer items-center justify-center border p-2 transition-all duration-75',
			disabled && disabledClasses,
			variantClasses,
			fullWidth ? 'w-full' : 'w-max',
			shapeClasses
		],
		appendClass?.toString()
	)}
>
	{@render children?.()}
</a>
