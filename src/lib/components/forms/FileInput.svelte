<script lang="ts">
	interface Props {
		accept?: HTMLInputElement['accept'];
		multiple?: HTMLInputElement['multiple'];
		disabled?: HTMLInputElement['disabled'];
		name?: HTMLInputElement['name'];
		files?: FileList;
		children?: any;
		buttonText?: string;
		rounded?: 'none' | 'full' | 'lg';
		fullWidth?: boolean;
	}

	let {
		accept,
		multiple = false,
		disabled = false,
		name,
		files = $bindable(),
		children,
		buttonText = 'Select file',
		rounded = 'none',
		fullWidth = false
	}: Props = $props();

	let fileInput: HTMLInputElement | null = $state(null);
	let fileName: string = $state('');

	function handleButtonClick() {
		fileInput?.click();
	}

	function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			files = target.files;
			fileName = Array.from(files)
				.map((file) => file.name)
				.join(', ');
		} else {
			fileName = '';
		}
	}
</script>

<div
	class={[
		'flex',
		fullWidth && 'w-full',
		rounded === 'full' && 'rounded-full',
		rounded === 'lg' && 'rounded-lg'
	]}
>
	<input
		type="file"
		{accept}
		{multiple}
		{disabled}
		{name}
		bind:files
		class="hidden"
		bind:this={fileInput}
		onchange={handleFileChange}
	/>
	<button
		class={[
			'flex h-full w-full items-center justify-center',
			'bg-primary-200 border-primary-200 text-primary-900 hover:bg-primary-300 hover:border-primary-300 active:bg-primary-200 active:border-primary-200',
			'dark:bg-primary-700 dark:border-primary-700 dark:text-primary-50 dark:hover:bg-primary-800 dark:hover:border-primary-800 dark:active:bg-primary-700 dark:active:border-primary-700',
			fullWidth && 'w-full',
			rounded === 'full' && 'rounded-full',
			rounded === 'lg' && 'rounded-lg'
		]}
		onclick={handleButtonClick}
		type="button"
	>
		<span class="font-bold">{fileName !== '' ? fileName : buttonText}</span>
	</button>
</div>
