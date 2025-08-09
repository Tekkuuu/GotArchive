<script lang="ts">
	import * as z from 'zod/v4';

	interface Props {
		children?: any;
		value: string | undefined;
		rounded?: boolean;
		showHour?: boolean;
		showMinute?: boolean;
		showSecond?: boolean;
		fullWidth?: boolean;
		showValid?: boolean;
		name?: string;
	}

	const validate = z.iso.time();

	let {
		children,
		value = $bindable(),
		rounded = false,
		showHour = true,
		showMinute = true,
		showSecond = true,
		fullWidth = false,
		showValid = true,
		name
	}: Props = $props();

	let hour = $state('');
	let minute = $state('');
	let second = $state('');

	let mInp: HTMLInputElement | undefined = $state();
	let sInp: HTMLInputElement | undefined = $state();

	let lastValue = '';

	// When value changes from outside, update hour/minute/second
	$effect(() => {
		if (value && value !== lastValue) {
			const [h = '', m = '', s = ''] = value.split(':');
			hour = h;
			minute = m;
			second = s;
			lastValue = value;
		}
	});

	// When hour/minute/second change, update value
	$effect(() => {
		const valid = validate.safeParse(
			`${showHour ? hour : '00'}:${showMinute ? minute : '00'}:${showSecond ? second : '00'}`
		);

		if (valid.success) {
			value = valid.data;
			lastValue = valid.data;
		} else {
			value = undefined;
			lastValue = '';
		}
	});

	$effect(() => {
		if (hour.length === 2) {
			mInp?.focus();
		}
	});

	$effect(() => {
		if (minute.length === 2) {
			sInp?.focus();
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
	<div class="inline-flex items-center">
		{#if showHour}
			<input
				type="text"
				placeholder="HH"
				maxLength="2"
				class="placeholder:text-primary-400 w-15 p-1 text-center font-bold outline-0"
				bind:value={hour}
			/>
		{/if}
		{#if showHour && showMinute}
			<span class="py-1 text-lg font-bold">:</span>
		{/if}
		{#if showMinute}
			<input
				type="text"
				maxLength="2"
				placeholder="MM"
				class="placeholder:text-primary-400 w-15 p-1 text-center font-bold outline-0"
				bind:value={minute}
				bind:this={mInp}
			/>
		{/if}
		{#if showMinute && showSecond}
			<span class="py-1 text-lg font-bold">:</span>
		{/if}
		{#if showSecond}
			<input
				type="text"
				maxLength="2"
				placeholder="SS"
				class="placeholder:text-primary-400 w-15 p-1 text-center font-bold outline-0"
				bind:value={second}
				bind:this={sInp}
			/>
		{/if}
		<input type="hidden" {name} bind:value />
	</div>
</div>
