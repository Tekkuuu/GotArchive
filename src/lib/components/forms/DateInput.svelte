<script lang="ts">
	import * as z from 'zod/v4';

	interface Props {
		children?: any;
		value: string | undefined;
		rounded?: boolean;
		fullWidth?: boolean;
		showValid?: boolean;
		name?: string;
	}

	const validate = z.iso.date();

	let {
		children,
		value = $bindable(),
		rounded = false,
		fullWidth = false,
		showValid = true,
		name
	}: Props = $props();

	let year = $state('');
	let month = $state('');
	let day = $state('');

	let mInp: HTMLInputElement;
	let dInp: HTMLInputElement;

	let lastValue = '';

	// When value changes from outside, update year/month/day
	$effect(() => {
		if (value && value !== lastValue) {
			const [y, m, d] = value.split('-');
			year = y;
			month = m;
			day = d;
			lastValue = value;
		}
	});

	// When year/month/day change, update value
	$effect(() => {
		const valid = validate.safeParse(`${year}-${month}-${day}`);
		if (valid.success) {
			value = valid.data;
			lastValue = valid.data;
		} else {
			value = undefined;
			lastValue = '';
		}
	});

	$effect(() => {
		if (year.length === 4) {
			mInp?.focus();
		}
	});

	$effect(() => {
		if (month.length === 2) {
			dInp?.focus();
		}
	});
</script>

<div
	class={[
		'text-primary-900 dark:text-primary-50',
		'bg-primary-200 dark:bg-primary-700',
		'focus-within:border-accent-400',
		'border transition-colors duration-75',
		'inline-flex min-h-10 justify-center',
		rounded && 'rounded-lg',
		fullWidth && 'w-full',
		showValid
			? value === undefined
				? 'border-danger'
				: 'border-success'
			: 'border-primary-200 dark:border-primary-700'
	]}
>
	{#if children}
		<div class="inline-flex border-r p-1">
			{@render children?.()}
		</div>
	{/if}
	<input
		type="text"
		placeholder="YYYY"
		maxlength="4"
		class="placeholder:text-primary-400 w-15 p-1 text-center font-bold outline-0"
		bind:value={year}
	/>
	<span class="py-1 text-lg font-bold">/</span>
	<input
		type="text"
		maxlength="2"
		placeholder="MM"
		class="placeholder:text-primary-400 w-15 p-1 text-center font-bold outline-0"
		bind:value={month}
		bind:this={mInp}
	/>
	<span class="py-1 text-lg font-bold">/</span>
	<input
		type="text"
		maxlength="2"
		placeholder="DD"
		class="placeholder:text-primary-400 w-15 p-1 text-center font-bold outline-0"
		bind:value={day}
		bind:this={dInp}
	/>
	<input type="hidden" {name} bind:value />
</div>
