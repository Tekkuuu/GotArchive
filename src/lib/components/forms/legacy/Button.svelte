<script lang="ts">
	import type { Icon } from 'lucide-svelte';
	import { twMerge } from 'tailwind-merge';

	interface Props {
		type?: 'button' | 'submit' | 'reset';
		form?: string;
		variant?: 'submit' | 'warning' | 'danger' | 'info' | 'default';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		filled?: boolean;
		text?: string;
		onclick?: (event: Event) => void;
		icon?: typeof Icon;
		disabled?: boolean;
		href?: string;
	}

	let {
		type = 'button',
		filled = false,
		form,
		variant = 'default',
		text,
		onclick,
		icon,
		disabled = false,
		size = 'sm',
		href
	}: Props = $props();

	let style = `
    tranition-all flex 
    flex-1 items-center 
    justify-center gap-2
    border font-bold duration-150
    disabled:pointer-events-none
    disabled:text-primary-600 
    dark:disabled:text-primary-500 
    disabled:border-primary-400 
    dark:disabled:border-primary-600
    ${filled && 'disabled:bg-primary-400 dark:disabled:bg-primary-600'}
    ${size === 'sm' && 'p-1'}
    ${size === 'md' && 'p-2'}
    ${size === 'lg' && 'p-3'}
    ${size === 'xl' && 'p-4'}
  `;

	let styleLink = `
    tranition-all flex 
    flex-1 items-center 
    justify-center gap-2
    border font-bold duration-150
    ${filled && disabled && 'bg-primary-400 dark:bg-primary-600'}
    ${size === 'sm' && 'p-1'}
    ${size === 'md' && 'p-2'}
    ${size === 'lg' && 'p-3'}
    ${size === 'xl' && 'p-4'}
    ${disabled && 'pointer-events-none text-primary-600 dark:text-primary-500 border-primary-400 dark:border-primary-600'}
  `;

	let variants = new Map<string, Array<string>>([
		[
			'submit',
			[
				'border-success hover:bg-success-light active:bg-success-light',
				filled
					? 'bg-success text-primary-900 hover:bg-success-light hover:border-success-light active:bg-success active:border-success'
					: 'bg-transparent text-success hover:bg-success hover:text-primary-900 active:bg-success-light active:border-success-light'
			]
		],
		[
			'warning',
			[
				'border-warning hover:bg-warning-light active:bg-warning-light',
				filled
					? 'bg-warning text-primary-900 hover:bg-warning-light hover:border-warning-light active:bg-warning active:border-warning'
					: 'bg-transparent text-warning hover:bg-warning hover:text-primary-900 active:bg-warning-light active:border-warning-light'
			]
		],
		[
			'danger',
			[
				'border-danger hover:bg-danger-light active:bg-danger-light',
				filled
					? 'bg-danger text-primary-900 hover:bg-danger-light hover:border-danger-light active:bg-danger active:border-danger'
					: 'bg-transparent text-danger hover:bg-danger hover:text-primary-900 active:bg-danger-light active:border-danger-light'
			]
		],
		[
			'info',
			[
				'border-info hover:bg-info-light active:bg-info-light',
				filled
					? 'bg-info text-primary-900 hover:bg-info-light hover:border-info-light active:bg-info active:border-info'
					: 'bg-transparent text-info hover:bg-info hover:text-primary-900 active:bg-info-light active:border-info-light'
			]
		],
		[
			'default',
			[
				'border-primary-200 hover:bg-primary-400 active:bg-primary-200',
				'dark:border-primary-700 dark:hover:bg-primary-700 dark:active:bg-primary-700',
				filled
					? 'bg-primary-200 text-primary-900 hover:bg-primary-300 hover:border-primary-300 active:bg-primary-200 active:border-primary-200'
					: 'bg-transparent text-primary-200 hover:bg-primary-200 hover:text-primary-900 active:bg-primary-300 active:border-primary-300',
				filled
					? 'dark:bg-primary-700 dark:text-primary-900 dark:hover:bg-primary-800 dark:hover:border-primary-800 dark:active:bg-primary-700 dark:active:border-primary-700'
					: 'dark:bg-transparent dark:text-primary-700 dark:hover:bg-primary-700 dark:hover:text-primary-900 dark:active:bg-primary-800 dark:active:border-primary-800'
			]
		]
	]);
</script>

<!--
@component LegacyButton
-->
{#if !href}
	<button {type} {form} {onclick} {disabled} class={twMerge(variants.get(variant), style)}>
		{#if icon}
			{@const Icon = icon}
			<Icon color="currentColor" />
		{/if}
		{#if text}
			<span>{text}</span>
		{/if}
	</button>
{:else}
	<a {href} class={twMerge(variants.get(variant), styleLink)}>
		{#if icon}
			{@const Icon = icon}
			<Icon color="currentColor" />
		{/if}
		{#if text}
			<span>{text}</span>
		{/if}
	</a>
{/if}
