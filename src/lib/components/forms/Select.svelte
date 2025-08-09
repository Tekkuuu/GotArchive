<script lang="ts">
	import _ from 'lodash';
	import { Plus, X } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import { outclick } from '$lib/outclick';
	import { onMount } from 'svelte';
	import type { ClassValue } from 'svelte/elements';

	interface BaseProps {
		children?: any;
		rounded?: boolean;
		options: { value: number | string; label: string }[];
		textAlign?: 'justify-start' | 'justify-center' | 'justify-end';
		disabled?: boolean;
		placeholder?: string;
		search?: boolean;
		onselect?: () => void;
		onadd?: (current: string) => void;
		appendClass?: ClassValue;
	}

	interface SelectProps extends BaseProps {
		allowMultiple?: never;
		selected: { value: number | string; label: string } | undefined;
		allowDeselect?: boolean;
		minimum?: never;
		maximum?: never;
		summary?: never;
	}

	interface MultiSelectProps extends BaseProps {
		allowMultiple: true;
		selected: { value: number | string; label: string }[];
		minimum?: number;
		maximum?: number;
		allowDeselect?: never;
		summary?: boolean;
	}

	let {
		children,
		rounded = false,
		options,
		textAlign = 'justify-start',
		disabled = false,
		placeholder,
		allowDeselect = false,
		search = false,
		selected = $bindable(undefined),
		onselect,
		onadd,
		minimum = 0,
		maximum = Infinity,
		summary,
		appendClass
	}: SelectProps | MultiSelectProps = $props();

	let open: boolean = $state(false);
	let searchInput: string = $state('');
	let filtered = $derived(
		options.filter((option) => {
			return (
				option.label.toLowerCase().includes(searchInput.toLowerCase()) ||
				option.value.toString().toLowerCase().includes(searchInput.toLowerCase())
			);
		})
	);

	let dropdownRef: HTMLDivElement | undefined = $state(undefined);
	let dropdownParentRef: HTMLDivElement | undefined = $state(undefined);
	let selectRef: HTMLButtonElement | undefined = $state(undefined);
	let dropdownAbove: boolean = $state(false);
	let canRound: boolean = $state(true);

	function checkDropdownPosition() {
		const parentRect = dropdownParentRef?.getBoundingClientRect();
		const dropdownHeight = dropdownRef?.offsetHeight ?? 0;
		const spaceBelow = window.innerHeight - (parentRect?.bottom ?? 0);
		const spaceAbove = parentRect?.top ?? 0;

		dropdownAbove = spaceBelow < dropdownHeight && spaceAbove >= dropdownHeight;
	}

	function onOptionClick(event: MouseEvent, option: (typeof options)[number]) {
		event.preventDefault();

		if (Array.isArray(selected)) {
			// Multi select mode
			// If user clicked on already selected option, deselect it if it woun't go under minimum
			// If user clicked on non selected option, add it to selected if it won't go over maximum
			const checkSelected = _.findIndex(selected, option);
			if (checkSelected !== -1 && selected.length > minimum) {
				selected = selected.filter((s) => !_.isEqual(s, option));
			} else if (selected.length < maximum && checkSelected === -1) {
				selected = [...selected, option];
			}
		} else {
			// Single select mode, user clicked on already selected option
			// If allowDeselect is true, deselect the option
			// If clicked option is not selected, select it and trigger onselect callback
			if (_.isEqual(selected, option) && allowDeselect) {
				selected = undefined;
			} else if (!_.isEqual(selected, option)) {
				selected = option;
				onselect?.();
			}
			open = false;
		}
	}

	const isPlaceholder = () => {
		return placeholder && (!selected || (Array.isArray(selected) && selected.length === 0));
	};

	onMount(() => {
		window.addEventListener('resize', checkDropdownPosition);
		window.addEventListener('scroll', checkDropdownPosition);

		return () => {
			window.removeEventListener('resize', checkDropdownPosition);
			window.removeEventListener('scroll', checkDropdownPosition);
		};
	});
</script>

<div
	use:outclick
	onoutclick={() => (open = false)}
	class={['relative flex min-h-10 flex-col', appendClass]}
>
	<div
		class={[
			'dark:bg-primary-700 bg-primary-200 text-primary-900 dark:text-primary-50 flex min-h-10 w-full',
			rounded && 'rounded-lg',
			rounded && !canRound && 'rounded-b-none'
		]}
		bind:this={dropdownParentRef}
	>
		{@render children?.()}
		<button
			bind:this={selectRef}
			type="button"
			onclick={(e) => {
				e.preventDefault();
				open = !open;
			}}
			class={[
				'peer flex w-full cursor-pointer flex-wrap items-center gap-1 border-b p-1 transition-all duration-150 focus:outline-none',
				'focus:border-accent-400 not-disabled:active:border-accent-400',
				'border-b-primary-200 dark:border-b-primary-700',
				isPlaceholder() &&
					'text-primary-500 dark:text-primary-300 dark:disabled:text-primary-400 disabled:text-primary-400',
				rounded && 'rounded-lg',
				rounded && !canRound && 'rounded-b-none',
				textAlign
			]}
			{disabled}
		>
			{#if Array.isArray(selected) && summary}
				<span>{selected.length > 0 ? `${selected.length} selected` : placeholder}</span>
			{:else if Array.isArray(selected) && selected.length > 0}
				{#each selected as s}
					<span class="dark:bg-primary-800 bg-primary-300 rounded-lg px-1 py-0.5">{s.label}</span>
				{/each}
			{:else if Array.isArray(selected) && selected.length === 0}
				<span>{placeholder}</span>
			{:else if !Array.isArray(selected)}
				<span>{selected?.label || placeholder}</span>
			{/if}
		</button>
	</div>
	{#if open}
		<div
			class={[
				'absolute z-50 max-h-80 w-full overflow-y-scroll',
				'dark:bg-primary-700 bg-primary-200',
				dropdownAbove ? 'top-0 -translate-y-full' : 'bottom-0 translate-y-full',
				rounded && 'rounded-b-lg'
			]}
			transition:slide={{ easing: sineInOut, duration: 150 }}
			bind:this={dropdownRef}
			onintroend={checkDropdownPosition}
			onintrostart={() => (canRound = false)}
			onoutroend={() => (canRound = true)}
		>
			{#if search}
				<div class="bg-primary-300 dark:bg-primary-600 flex h-8 gap-1">
					<input
						type="text"
						placeholder="Search..."
						class="dark:text-primary-50 text-primary-900 border-accent-400 w-full p-1 outline-none"
						bind:value={searchInput}
					/>
					<button
						class={[
							'dark:*:text-primary-50 *:text-primary-900 hover:*:text-accent-400 transition-all duration-150',
							!onadd && 'pr-2'
						]}
						type="button"
						onclick={(_) => (searchInput = '')}
					>
						<X />
					</button>
					{#if onadd}
						<button
							class="dark:*:text-primary-50 *:text-primary-900 hover:*:text-accent-400 pr-2 transition-all duration-150"
							type="button"
							onclick={(_) => onadd?.(searchInput)}
						>
							<Plus />
						</button>
					{/if}
				</div>
			{/if}
			{#each filtered as option}
				<button
					type="button"
					class={[
						(Array.isArray(selected) ? _.find(selected, option) : _.isEqual(selected, option)) &&
							'bg-accent-400',
						'flex w-full items-center justify-center p-1',
						'dark:text-primary-50 text-primary-900 hover:bg-accent-400 transition-all duration-150'
					]}
					onmousedown={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onOptionClick(e, option);
					}}
				>
					<span>{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
