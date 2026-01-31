<script lang="ts">
	import * as z from 'zod';

	interface Props {
		children?: any;
		value: string | undefined;
		rounded?: boolean;
		tzOffset?: string;
		showHour?: boolean;
		showMinute?: boolean;
		showSecond?: boolean;
		fullWidth?: boolean;
		showValid?: boolean;
		name?: string;
	}

	const validate = z.iso.datetime({ offset: true });

	let {
		children,
		value = $bindable(),
		rounded = false,
		tzOffset = '00:00',
		showHour = true,
		showMinute = true,
		showSecond = true,
		fullWidth = false,
		showValid = true,
		name
	}: Props = $props();

	let year = $state('');
	let month = $state('');
	let day = $state('');
	let hour = $state('');
	let minute = $state('');
	let second = $state('');

	let monthInp: HTMLInputElement;
	let dayInp: HTMLInputElement;
	let hourInp: HTMLInputElement | undefined = $state();
	let minuteInp: HTMLInputElement | undefined = $state();
	let secondInp: HTMLInputElement | undefined = $state();

	$effect(() => {
		const valid = validate.safeParse(
			`${year}-${month}-${day}T${showHour ? hour : '00'}:${showMinute ? minute : '00'}:${showSecond ? second : '00'}+${tzOffset}`
		);

		if (valid.success) {
			value = valid.data;
		} else {
			value = undefined;
		}
	});

	$effect(() => {
		if (year.length === 4) {
			monthInp?.focus();
		}
	});

	$effect(() => {
		if (month.length === 2) {
			dayInp?.focus();
		}
	});

	$effect(() => {
		if (day.length === 2) {
			hourInp?.focus();
		}
	});

	$effect(() => {
		if (hour.length === 2) {
			minuteInp?.focus();
		}
	});

	$effect(() => {
		if (minute.length === 2) {
			secondInp?.focus();
		}
	});

	const inputStyle = 'placeholder:text-primary-400 w-15 text-center font-bold outline-0 md:p-2';
</script>

<div
	class={[
		'text-primary-900 dark:text-primary-50',
		'bg-primary-200 dark:bg-primary-700',
		'focus-within:border-accent-400',
		'border transition-colors duration-75',
		'inline-flex justify-center',
		rounded && 'rounded-xl',
		fullWidth && 'w-full',
		showValid
			? value === undefined
				? 'border-danger'
				: 'border-success'
			: 'border-primary-200 dark:border-primary-700'
	]}
>
	{#if children}
		<div class="flex items-center justify-center border-r p-2">
			{@render children?.()}
		</div>
	{/if}
	<div class="flex items-center max-sm:flex-col">
		<div class="inline-flex items-center">
			<input
				type="text"
				placeholder="YYYY"
				maxlength="4"
				class={[inputStyle, 'max-sm:pt-2']}
				bind:value={year}
			/>
			<span class="text-lg font-bold max-sm:pt-2 md:p-2">/</span>
			<input
				type="text"
				maxlength="2"
				placeholder="MM"
				class={[inputStyle, 'max-sm:pt-2']}
				bind:value={month}
				bind:this={monthInp}
			/>
			<span class="text-lg font-bold max-sm:pt-2 md:p-2">/</span>
			<input
				type="text"
				maxlength="2"
				placeholder="DD"
				class={[inputStyle, 'max-sm:pt-2']}
				bind:value={day}
				bind:this={dayInp}
			/>
		</div>
		<div class="inline-flex items-center">
			{#if showHour}
				<input
					type="text"
					placeholder="HH"
					maxLength="2"
					class={[inputStyle, 'max-sm:pb-2']}
					bind:value={hour}
					bind:this={hourInp}
				/>
			{/if}
			{#if showHour && showMinute}
				<span class="text-lg font-bold max-sm:pb-2 md:p-2">:</span>
			{/if}
			{#if showMinute}
				<input
					type="text"
					maxLength="2"
					placeholder="MM"
					class={[inputStyle, 'max-sm:pb-2']}
					bind:value={minute}
					bind:this={minuteInp}
				/>
			{/if}
			{#if showMinute && showSecond}
				<span class="text-lg font-bold max-sm:pb-2 md:p-2">:</span>
			{/if}
			{#if showSecond}
				<input
					type="text"
					maxLength="2"
					placeholder="SS"
					class={[inputStyle, 'max-sm:pb-2']}
					bind:value={second}
					bind:this={secondInp}
				/>
			{/if}
			<input type="hidden" {name} bind:value />
		</div>
	</div>
</div>
