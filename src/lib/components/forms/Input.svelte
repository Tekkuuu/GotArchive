<script lang="ts">
	import { Plus, Minus } from 'lucide-svelte';
	import type { ClassValue } from 'svelte/elements';
	import type { ClassNameValue } from 'tailwind-merge';

	interface Props {
		value: string | number;
		type?: 'text' | 'email' | 'password' | 'number';
		placeholder?: string;
		id?: string;
		name?: string;
		fullWidth?: boolean;
		rounded?: 'none' | 'full' | 'lg';
		disabled?: boolean;
		children?: any;
		onchange?: () => void;
		oninput?: () => void;
		appendClass?: ClassValue | ClassNameValue;
	}

	let {
		type = 'text',
		placeholder,
		value = $bindable(),
		id,
		name,
		fullWidth = false,
		rounded = 'none',
		disabled,
		children,
		onchange,
		oninput,
		appendClass
	}: Props = $props();
</script>

<div
	class={[
		'bg-primary-200 dark:bg-primary-700 flex items-stretch justify-center gap-1 p-1',
		'text-primary-900 dark:text-primary-50',
		'focus-within:border-b-accent-400 dark:border-primary-700 border-primary-200 border',
		'min-h-10',
		fullWidth && 'w-full',
		rounded === 'full' && 'rounded-full',
		rounded === 'lg' && 'rounded-lg',
		appendClass
	]}
>
	{@render children?.()}
	<input
		{id}
		class={[
			'text-primary-900 dark:text-primary-50 disabled:text-primary-600 dark:disabled:text-primary-300',
			'flex w-full grow items-center justify-center focus:outline-none'
		]}
		{type}
		{placeholder}
		bind:value
		{disabled}
		name={name ? name : id}
		{onchange}
		{oninput}
	/>
	{#if type == 'number'}
		<button
			onclick={(e) => {
				e.preventDefault();
				typeof value == 'number' ? value++ : (value = 0);
				onchange?.();
				oninput?.();
			}}
			class={[
				'flex aspect-square grow items-center justify-center',
				'hover:text-accent-400 transition-colors duration-150',
				'active:text-primary-500 active:border-primary-500',
				rounded === 'full' && 'rounded-full',
				rounded === 'lg' && 'rounded-lg'
			]}
		>
			<Plus />
		</button>
		<button
			onclick={(e) => {
				e.preventDefault();
				typeof value == 'number' ? value-- : (value = 0);
				onchange?.();
				oninput?.();
			}}
			class={[
				'flex aspect-square grow items-center justify-center',
				'hover:text-accent-400 transition-colors duration-150',
				'active:text-primary-500 active:border-primary-500',
				rounded === 'full' && 'rounded-full',
				rounded === 'lg' && 'rounded-lg'
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
