<script lang="ts">
	import { type Icon } from 'lucide-svelte';
	import { twMerge } from 'tailwind-merge';
	import { Plus, Minus } from 'lucide-svelte';

	interface Props {
		icon?: typeof Icon;
		type: 'text' | 'email' | 'password' | 'number';
		placeholder?: string;
		value: string | number;
		id?: string;
		name?: string;
		disabled?: boolean;
	}

	let { icon, type, placeholder, value = $bindable(), id, name, disabled }: Props = $props();

	/**
	 * DARK MODE:
	 * primary-700 -> bg
	 * primary-50 -> text/icon
	 * primary-500 -> disabled/icon
	 * primary-300 -> placeholder
	 * primary-800 -> button hover
	 * primary-900 -> button active
	 */
	let dark = {
		input: `
      dark:bg-primary-700 
      dark:text-primary-50 
      dark:border-primary-700
      dark:placeholder:text-primary-300 
      dark:disabled:placeholder:text-primary-500 
      dark:disabled:text-primary-500 
    `,
		icon: `
      dark:bg-primary-700 
      dark:*:stroke-primary-50 
      dark:peer-disabled:*:stroke-primary-500
    `,
		button: `
      dark:active:bg-primary-900 
      dark:hover:bg-primary-800 
      dark:peer-disabled:*:stroke-primary-500
    `
	};

	/**
	 * LIGHT MODE:
	 * primary-200 -> bg
	 * primary-900 -> text/icon
	 * primary-400 -> disabled/icon
	 * primary-600 -> placeholder
	 * primary-100 -> button hover
	 * primary-50 -> button active
	 */
	let light = {
		input: `
      bg-primary-200 
      text-primary-900 
      border-primary-200
      placeholder:text-primary-600 
      disabled:placeholder:text-primary-400 
      disabled:text-primary-400 
    `,
		icon: `
      bg-primary-200 
      *:stroke-primary-900 
      peer-disabled:*:stroke-primary-400
    `,
		button: `
      active:bg-primary-50 
      hover:bg-primary-100 
      peer-disabled:*:stroke-primary-400
    `
	};

	let styles = {
		input: `
      peer p-2 transition-all duration-150 flex-1 border-b
      focus:outline-none focus:border-accent-400 
      not-disabled:active:border-accent-400 
    `,
		icon: 'flex justify-center items-center aspect-square transition-all duration-150',
		button: 'transition-all duration-150 peer-disabled:pointer-events-none'
	};
</script>

<div class="flex flex-1">
	<input
		{id}
		class={[styles.input, light.input, dark.input]}
		{type}
		{placeholder}
		bind:value
		{disabled}
		name={name ? name : id}
	/>
	{#if icon}
		{@const Icon = icon}
		<!-- 'order-first' to make input's 'peer' class work properly (input need to be first child, move the icon with order) -->
		<div class={[styles.icon, light.icon, dark.icon, 'order-first']}>
			<Icon />
		</div>
	{/if}
	{#if type == 'number'}
		<button
			onclick={(e) => {
				e.preventDefault();
				typeof value == 'number' ? value++ : (value = 0);
			}}
			class={[
				twMerge(styles.icon, styles.button),
				twMerge(light.icon, light.button),
				twMerge(dark.icon, dark.button)
			]}
		>
			<Plus />
		</button>
		<button
			onclick={(e) => {
				e.preventDefault();
				typeof value == 'number' ? value-- : (value = 0);
			}}
			class={[
				twMerge(styles.icon, styles.button),
				twMerge(light.icon, light.button),
				twMerge(dark.icon, dark.button)
			]}
		>
			<Minus />
		</button>
	{/if}
</div>

<style>
	input[type='number']::-moz-inner-spinner-button,
	input[type='number']::-webkit-inner-spin-button {
		--moz-appareance: none;
		margin: 0;
	}

	input[type='number'] {
		-moz-appearance: textfield;
		appearance: textfield;
	}
</style>
