<script lang="ts">
	import type { PageProps } from './$types';
	import { format } from 'date-fns';
	import { marked } from 'marked';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { deleteFormSchema, updateFormSchema } from './util';
	import { toast } from '$lib/components/ui/toaster';
	import { CircleCheck, CircleAlert, Circle, CircleX, Search, CircleOff } from 'lucide-svelte';
	import { Button } from '$lib/components/forms';
	import _ from 'lodash';
	import Fuse from 'fuse.js';
	import { Input } from '$lib/components/forms';
	import { LucideIcon } from '$lib/components/util';

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

		// Step 1: Parse field-based queries, e.g. tag:bug status:open text:...
		// Regex: matches field:value pairs
		const fieldRegex = /\b(\w+):(".*?"|\S+)/g;
		let match;
		const fieldFilters: Record<string, string> = {};
		let restInput = normalizedInput;

		while ((match = fieldRegex.exec(normalizedInput))) {
			// Extract field and value, remove quotes around value if present
			const field = match[1];
			let value = match[2];
			if (value.startsWith('"') && value.endsWith('"')) {
				value = value.slice(1, -1);
			}
			fieldFilters[field] = value;
			// Remove matched part from the rest input
			restInput = restInput.replace(match[0], '').trim();
		}

		// Step 2: Apply field filters
		let filtered = infos;
		type InfoType = (typeof infos)[number];
		for (const [field, value] of Object.entries(fieldFilters)) {
			if (
				_.includes(['tag', 'status', 'text', 'contact_info', 'anonymousUUID', 'implemented'], field)
			) {
				filtered = filtered.filter((info) => {
					const infoValue = info[field as keyof InfoType];

					// Boolean fields
					if (typeof infoValue === 'boolean') {
						return value === 'true' ? infoValue : !infoValue;
					}

					// String fields
					if (typeof infoValue === 'string') {
						return infoValue.toLowerCase().includes(value.toLowerCase());
					}

					// Date fields
					if (infoValue instanceof Date) {
						// You can customize to match on date string, etc.
						return infoValue.toISOString().includes(value);
					}

					// Number fields
					if (typeof infoValue === 'number') {
						return infoValue === Number(value);
					}

					// Fallback for unknown types
					return infoValue == value;
				});
			}
		}

		// Step 3: If restInput (after field filters) is not empty, do fuzzy search on remaining records
		if (restInput.length > 0) {
			const fuse = new Fuse(filtered, {
				keys: ['text', 'contact_info', 'anonymousUUID'], // Only search in relevant textual fields
				threshold: 0.2,
				ignoreLocation: true,
				minMatchCharLength: 2
			});
			const result = fuse.search(restInput);
			return result.map((r) => r.item);
		}

		return filtered;
	}

	function tagStyles(tag: string) {
		switch (tag) {
			case 'bug':
				return 'bg-danger';
			case 'feature request':
				return 'bg-success';
			case 'question':
				return 'bg-warning';
			default:
				return 'bg-info';
		}
	}

	function borderStyle(status: string) {
		switch (status) {
			case 'open':
				return 'bg-success';
			case 'inprogress':
				return 'bg-info';
			case 'closed':
				return 'bg-warning';
			case 'wontfix':
				return 'bg-danger';
			default:
				return 'bg-gray-300 text-black';
		}
	}
</script>

{#snippet feedback(info: (typeof feedbacks)[number])}
	{#key info.status}
		<div
			class="bg-primary-200 dark:bg-primary-700 text-primary-900 dark:text-primary-50 relative flex flex-col gap-3 rounded-xl p-4 shadow-md"
		>
			<!-- Status Border -->
			<div
				class={['absolute top-0 left-0 h-full w-2 rounded-l-xl', borderStyle(info.status)]}
			></div>

			<!-- Header: UUID & Status -->
			<div
				class="flex flex-col items-start justify-between gap-2 min-md:flex-row min-md:items-center"
			>
				<div>
					<div class="text-primary-500 dark:text-primary-400 mb-1 text-xs font-semibold">
						User UUID
					</div>
					<div
						class="bg-primary-300 dark:bg-primary-600 rounded-md px-2 py-1 font-mono text-xs break-all shadow-sm"
					>
						{info.anonymousUUID || 'N/A'}
					</div>
				</div>
				<div class="mt-2 flex gap-2 min-md:mt-0">
					<Button
						variant="submit"
						filled={info.status === 'open'}
						shape="circle"
						onclick={() => {
							if (info.status === 'open') return;
							$updateForm.feedbackId = info.feedbackId;
							$updateForm.status = 'open';
							updateSubmit();
						}}
					>
						<CircleCheck />
					</Button>
					<Button
						variant="info"
						filled={info.status === 'inprogress'}
						shape="circle"
						onclick={() => {
							if (info.status === 'inprogress') return;
							$updateForm.feedbackId = info.feedbackId;
							$updateForm.status = 'inprogress';
							updateSubmit();
						}}
					>
						<Circle />
					</Button>
					<Button
						variant="warning"
						filled={info.status === 'closed'}
						shape="circle"
						onclick={() => {
							if (info.status === 'closed') return;
							$updateForm.feedbackId = info.feedbackId;
							$updateForm.status = 'closed';
							updateSubmit();
						}}
					>
						<CircleX />
					</Button>
					<Button
						variant="danger"
						filled={info.status === 'wontfix'}
						shape="circle"
						onclick={() => {
							if (info.status === 'wontfix') return;
							$updateForm.feedbackId = info.feedbackId;
							$updateForm.status = 'wontfix';
							updateSubmit();
						}}
					>
						<CircleAlert />
					</Button>
					<Button
						variant="danger"
						filled
						shape="pill"
						onclick={() => {
							if (
								window.confirm(
									'Are you sure you want to delete this feedback? This action cannot be undone.'
								)
							) {
								$deleteForm.feedbackId = info.feedbackId;
								deleteSubmit();
							}
						}}
						appendClass="gap-1"
					>
						<LucideIcon icon={CircleOff} /><span class="font-bold">Delete</span>
					</Button>
				</div>
			</div>

			<!-- Timestamp -->
			<div class="text-primary-500 dark:text-primary-400 text-xs">
				{format(new Date(info.timestamp), 'yyyy-MM-dd, HH:mm:ss')}
			</div>

			<!-- Feedback Message -->
			<div
				class="prose prose-sm dark:prose-invert bg-primary-100 dark:bg-primary-800 rounded-md p-3"
			>
				{@html marked.parse(info.text)}
			</div>

			<!-- Footer: Contact & Tag -->
			<div class="mt-2 flex items-center justify-between">
				<span class="text-primary-500 dark:text-primary-400 text-xs"
					>Contact: <span class="font-medium">{info.contact_info || 'N/A'}</span></span
				>
				<span
					class={[
						tagStyles(info.tag),
						'text-primary-900 rounded-md px-2 py-1 text-xs font-semibold shadow'
					]}>{info.tag}</span
				>
			</div>
		</div>
	{/key}
{/snippet}

<div class="flex flex-col gap-1">
	<form method="post" use:deleteEnhance action="?/delete" class="hidden">
		<input type="number" bind:value={$deleteForm.feedbackId} />
	</form>
	<form method="post" use:updateEnhance action="?/update" class="hidden">
		<input type="text" bind:value={$updateForm.status} />
	</form>

	<div>
		<Input type="text" bind:value={filterInput} rounded="lg" fullWidth>
			<LucideIcon icon={Search} />
		</Input>
	</div>
	{#each _.sortBy(filter(feedbacks, filterInput), ['feedbackId']) as f}
		{@render feedback(f)}
	{/each}
</div>
