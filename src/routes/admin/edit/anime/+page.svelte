<script lang="ts">
	import type { PageProps } from './$types';
	import _ from 'lodash';
	import { Table } from '$lib/components/table';
	import { Button, LinkButton } from '$lib/components/forms';
	import { X, Pencil, CircleX } from 'lucide-svelte';
	import { toast } from '$lib/components/ui/toaster';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { formSchema } from './util';

	let { data }: PageProps = $props();

	let { form, enhance, errors, submit } = superForm(data.form, {
		dataType: 'json',
		validators: zod4Client(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime deleted successfully');
			} else if (result.type === 'failure') {
				toast.error(result.data?.text || 'Failed to delete anime', CircleX, 5000);
			} else if (result.type === 'error') {
				toast.error('An unexpected error occurred', CircleX, 5000);
			}
		}
	});
</script>

<svelte:head>
	<title>Admin | Edit anime | G.O.T Archive</title>
</svelte:head>

{#snippet row(rowData: (typeof data.anime)[number])}
	<div class="flex items-center justify-center gap-1">
		<LinkButton variant="warning" filled href={`/admin/edit/anime/${rowData.animeId}`}>
			<Pencil />
		</LinkButton>
		<Button
			variant="danger"
			filled
			onclick={(_) => {
				$form.animeId = rowData.animeId;
				submit();
			}}
		>
			<X />
		</Button>
	</div>
{/snippet}

<!-- TODO: Replace per-row form with one superform with hidden fields -->
<div class="flex w-full flex-col gap-1">
	<form method="POST" use:enhance action="?/delete" class="hidden">
		<input type="number" bind:value={$form.animeId} />
	</form>
	<Table
		filterable
		data={data.anime}
		columns={[
			{
				header: 'Actions',
				row: row
			}
		]}
	/>
</div>
