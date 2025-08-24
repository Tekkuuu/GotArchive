<script lang="ts">
	import type { PageServerLoad, PageProps } from './$types';
	import { formatWeekRange } from '$lib/util';
	import _ from 'lodash';
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { deleteFormSchema, previewFormSchema } from './util';
	import { toast } from '$lib/components/ui/toaster';
	import { Table } from '$lib/components/table';
	import { Button, LinkButton } from '$lib/components/forms';
	import { X, Pencil, Eye, EyeOff } from 'lucide-svelte';
	import { LucideIcon } from '$lib/components/util';

	let { data }: PageProps = $props();

	const {
		enhance: deleteEnhance,
		submit: deleteSubmit,
		form: deleteForm
	} = superForm(data.deleteForm, {
		dataType: 'json',
		validators: zod(deleteFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		invalidateAll: 'force',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime deleted successfully');
			} else if (result.type === 'failure') {
				toast.error(result.data?.text ?? 'Failed to delete anime');
			} else if (result.type === 'error') {
				toast.error('Failed to delete anime');
			}
		}
	});

	const {
		enhance: previewEnhance,
		submit: previewSubmit,
		form: previewForm
	} = superForm(data.previewForm, {
		dataType: 'json',
		validators: zod(previewFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		invalidateAll: 'force',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Pewview updated.');
			} else if (result.type === 'failure') {
				toast.error(result.data?.text ?? 'Failed to update pewview');
			} else if (result.type === 'error') {
				toast.error('Failed to update preview');
			}
		}
	});
</script>

<svelte:head>
	<title>Edit schedule | G.O.T Archive</title>
</svelte:head>

{#snippet row(rowData: (typeof data.schedule)[number])}
	<div class="flex gap-1">
		<LinkButton
			variant="warning"
			filled
			fullWidth
			href={`/admin/edit/schedule/${rowData.year}${rowData.week}`}
		>
			<Pencil />
		</LinkButton>
		<Button
			variant="danger"
			filled
			fullWidth
			onclick={() => {
				$deleteForm.scheduleId = rowData.scheduleId;
				deleteSubmit();
			}}
		>
			<X />
		</Button>
		{#key rowData.preview}
			<Button
				variant={rowData.preview ? 'submit' : 'danger'}
				filled
				fullWidth
				onclick={() => {
					$previewForm.scheduleId = rowData.scheduleId;
					$previewForm.preview = !rowData.preview;
					previewSubmit();
				}}
			>
				{#if rowData.preview}
					<LucideIcon icon={Eye} />
				{:else}
					<LucideIcon icon={EyeOff} />
				{/if}
			</Button>
		{/key}
	</div>
{/snippet}

<div class="flex w-full flex-col gap-1">
	<form use:deleteEnhance class="hidden" method="POST" action="?/delete">
		<input type="hidden" name="scheduleId" bind:value={$deleteForm.scheduleId} />
	</form>
	<form use:previewEnhance class="hidden" method="POST" action="?/preview">
		<input type="hidden" name="scheduleId" bind:value={$previewForm.scheduleId} />
		<input type="hidden" name="preview" bind:value={$previewForm.preview} />
	</form>
	<Table
		sortable
		filterable
		data={data.schedule}
		columns={[
			{
				header: 'Actions',
				row: row
			}
		]}
	/>
	<LinkButton shape="rounded" variant="info" filled fullWidth href="/admin/new/schedule">
		<span class="font-bold">Add Schedule</span>
	</LinkButton>
</div>
