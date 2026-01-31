<script lang="ts">
	import { Button, FileInput } from '$lib/components/forms';
	import { toast } from '$lib/components/ui/toaster';
	import _ from 'lodash';
	import { superForm, fileProxy } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import type { PageProps } from './$types';
	import { formSchema } from './util';

	let { data }: PageProps = $props();

	let { form, enhance, errors } = superForm(data.form, {
		dataType: 'json',
		validators: zod(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime create successfully');
			} else if (result.type === 'failure') {
				toast.error(result.data?.text || 'Failed to create anime');
			}
		}
	});

	const file = fileProxy(form, 'file');
</script>

<svelte:head>
	<title>Admin | New anime bulk | G.O.T Archive</title>
</svelte:head>

<div class="flex w-full flex-col items-center justify-center gap-1">
	<div class="flex w-full flex-col gap-1">
		<form
			method="POST"
			action="?/create"
			class="grid grid-cols-1 gap-1"
			style="grid-auto-rows: minmax(2.5em, auto);"
			id="form-new-anime-bulk"
			use:enhance
			enctype="multipart/form-data"
		>
			<FileInput name="file" accept="application/json" bind:files={$file} />
			<Button variant="submit" form="form-new-anime-bulk" type="submit" filled fullWidth>
				<span class="font-bold">Submit</span>
			</Button>
		</form>
	</div>
</div>
