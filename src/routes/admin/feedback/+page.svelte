<script lang="ts">
	import type { PageProps } from './$types';
	import { format } from 'date-fns';
	import { marked } from 'marked';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { deleteFormSchema, updateFormSchema } from './util';
	import { toast } from '$lib/components/ui/toaster';
	import { CircleCheck, CircleAlert, Circle, CircleX, Search, CircleOff } from 'lucide-svelte';
	import _ from 'lodash';
	import Fuse from 'fuse.js';
	import { confirm } from '$lib/util';

	let { data }: PageProps = $props();
	let { feedbacks } = $derived(data);

	let {
		form: deleteForm,
		enhance: deleteEnhance,
		errors: deleteErrors,
		submit: deleteSubmit
	} = superForm(data.deleteForm, {
		dataType: 'json',
		resetForm: false,
		validators: zod4Client(deleteFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Feedback deleted successfully!');
			} else if (result.type === 'failure') {
				toast.error('Failed to delete feedback.');
			} else if (result.type === 'error') {
				toast.error(result.error?.text ?? 'Filed to delete feedback.');
			}
		}
	});

	let {
		form: updateForm,
		enhance: updateEnhance,
		errors: updateErrors,
		submit: updateSubmit
	} = superForm(data.updateForm, {
		dataType: 'json',
		resetForm: false,
		validators: zod4Client(updateFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Feedback updated successfully!');
			} else if (result.type === 'failure') {
				toast.error('Failed to updated feedback.');
			} else if (result.type === 'error') {
				toast.error(result.error?.text ?? 'Filed to updated feedback.');
			}
		}
	});

	let filterInput = $state('');

	function filter(infos: typeof feedbacks, filterInput: string): typeof feedbacks {
		const normalizedInput = _.deburr(filterInput).trim();

		if (normalizedInput.length < 1) {
			return infos;
		}

		const fieldRegex = /\b(\w+):(".*?"|\S+)/g;
		let match;
		const fieldFilters: Record<string, string> = {};
		let restInput = normalizedInput;

		while ((match = fieldRegex.exec(normalizedInput))) {
			const field = match[1];
			let value = match[2];
			if (value.startsWith('"') && value.endsWith('"')) {
				value = value.slice(1, -1);
			}
			fieldFilters[field] = value;
			restInput = restInput.replace(match[0], '').trim();
		}

		let filtered = infos;
		type InfoType = (typeof infos)[number];
		for (const [field, value] of Object.entries(fieldFilters)) {
			if (
				_.includes(['tag', 'status', 'text', 'contact_info', 'anonymousUUID', 'implemented'], field)
			) {
				filtered = filtered.filter((info) => {
					const infoValue = info[field as keyof InfoType];

					if (typeof infoValue === 'boolean') {
						return value === 'true' ? infoValue : !infoValue;
					}

					if (typeof infoValue === 'string') {
						return infoValue.toLowerCase().includes(value.toLowerCase());
					}

					if (infoValue instanceof Date) {
						// You can customize to match on date string, etc.
						return infoValue.toISOString().includes(value);
					}

					if (typeof infoValue === 'number') {
						return infoValue === Number(value);
					}

					return infoValue == value;
				});
			}
		}

		if (restInput.length > 0) {
			const fuse = new Fuse(filtered, {
				keys: ['text', 'contact_info'], // Only search in relevant textual fields
				threshold: 0.2,
				ignoreLocation: true,
				minMatchCharLength: 2
			});
			const result = fuse.search(restInput);
			return result.map((r) => r.item);
		}

		return filtered;
	}

	function badgeStyle(tag: string) {
		switch (tag) {
			case 'bug':
				return 'badge-error';
			case 'feature request':
				return 'badge-success';
			case 'question':
				return 'badge-info';
			default:
				return 'badge-secondary';
		}
	}
</script>

{#snippet feedback(info: (typeof feedbacks)[number])}
	{#key info.status}
		<div class="card bg-base-300">
			<div class="card-body">
				<div class="card-title flex justify-between">
					{format(new Date(info.timestamp), 'yyyy-MM-dd, HH:mm:ss')}
				</div>

				<div class="prose prose-sm">
					{@html marked.parse(info.text)}
				</div>

				<div>
					<span>
						Contact: {info.contact_info || 'N/A'}
					</span>
				</div>
				<span class="badge {badgeStyle(info.tag)}">{_.startCase(info.tag)}</span>
				<div class="card-actions items-center justify-end">
					<button
						class="btn btn-circle btn-success {info.status !== 'open' && 'btn-outline'}"
						onclick={() => {
							if (info.status === 'open') return;
							$updateForm.feedbackId = info.feedbackId;
							$updateForm.status = 'open';
							updateSubmit();
						}}
					>
						<CircleCheck />
					</button>
					<button
						class="btn btn-circle btn-info {info.status !== 'inprogress' && 'btn-outline'}"
						onclick={() => {
							if (info.status === 'inprogress') return;
							$updateForm.feedbackId = info.feedbackId;
							$updateForm.status = 'inprogress';
							updateSubmit();
						}}
					>
						<Circle />
					</button>
					<button
						class="btn btn-circle btn-warning {info.status !== 'closed' && 'btn-outline'}"
						onclick={() => {
							if (info.status === 'closed') return;
							$updateForm.feedbackId = info.feedbackId;
							$updateForm.status = 'closed';
							updateSubmit();
						}}
					>
						<CircleX />
					</button>
					<button
						class="btn btn-circle btn-error {info.status !== 'wontfix' && 'btn-outline'}"
						onclick={() => {
							if (info.status === 'wontfix') return;
							$updateForm.feedbackId = info.feedbackId;
							$updateForm.status = 'wontfix';
							updateSubmit();
						}}
					>
						<CircleAlert />
					</button>
					<button
						class="btn btn-error w-fit rounded-full"
						onclick={() => {
							confirm(() => {
								$deleteForm.feedbackId = info.feedbackId;
								deleteSubmit();
							}, 'Are you sure you want to delete this feedback? This action cannot be undone.');
						}}
					>
						<CircleOff />Delete
					</button>
				</div>
			</div>
		</div>
	{/key}
{/snippet}

<div class="flex flex-col gap-2">
	<form method="post" use:deleteEnhance action="?/delete" class="hidden">
		<input type="number" bind:value={$deleteForm.feedbackId} />
	</form>
	<form method="post" use:updateEnhance action="?/update" class="hidden">
		<input type="text" bind:value={$updateForm.status} />
	</form>

	<div>
		<label class="input w-full">
			<span>Search</span>
			<input type="text" bind:value={filterInput} />
		</label>
	</div>
	{#each _.sortBy(filter(feedbacks, filterInput), ['feedbackId']) as f}
		{@render feedback(f)}
	{/each}
</div>
