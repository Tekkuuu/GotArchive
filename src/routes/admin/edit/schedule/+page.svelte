<script lang="ts">
	import type { PageProps } from './$types';
	import _ from 'lodash';
	import { superForm } from 'sveltekit-superforms';
	import { zod } from 'sveltekit-superforms/adapters';
	import { formSchema } from './util';
	import { toast } from '$lib/components/ui/toaster';
	import { X, Pencil } from 'lucide-svelte';
	import { confirm } from '$lib/util';

	let { data }: PageProps = $props();

	const { enhance, errors, submit, form } = superForm(data.form, {
		dataType: 'json',
		validators: zod(formSchema),
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
</script>

<svelte:head>
	<title>Edit schedule | G.O.T Archive</title>
</svelte:head>

<div class="flex w-full flex-col items-center gap-2">
	<form use:enhance class="hidden" method="POST" action="?/delete">
		<input type="hidden" name="scheduleId" bind:value={$form.scheduleId} />
	</form>
	<div class="rounded-box border-base-content/5 w-full max-w-5xl overflow-x-auto border">
		<table class="table">
			<thead>
				<tr class="uppercase">
					{#each _.keys(_.head(data.schedule)) as header}
						<th>{_.lowerCase(header)}</th>
					{/each}
					<th>actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.schedule as scheduleRow}
					<tr>
						{#each _.values(scheduleRow) as cell}
							<td>{cell}</td>
						{/each}
						<td class="flex gap-2">
							<a
								href={`/admin/edit/schedule/${scheduleRow.year}${scheduleRow.week}`}
								class="btn btn-warning"
							>
								<Pencil />
							</a>
							<button
								class="btn btn-error"
								type="button"
								onclick={() => {
									confirm(() => {
										$form.scheduleId = scheduleRow.scheduleId;
										submit();
									}, 'Are you sure you want to delete this schedule?');
								}}
							>
								<X />
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<a class="btn btn-success w-full max-w-5xl" href="/admin/new/schedule">Add Schedule</a>
</div>
