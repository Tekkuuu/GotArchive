<script lang="ts">
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { Fingerprint, Mail, Tag, Text, X } from 'lucide-svelte';
	import { toast } from '$lib/components/ui/toaster';
	import { Input, Checkbox, Button, Textarea, Select } from '$lib/components/forms';
	import { superForm } from 'sveltekit-superforms';
	import { feedbackSchema, feedbackTags } from '$lib/api/';
	import { getAnonymousUUIDStore } from '$lib/stores';
	import LucideIcon from '$lib/components/util/LucideIcon.svelte';
	import _ from 'lodash';

	interface Props {
		formData: SuperValidated<Infer<typeof feedbackSchema>>;
	}

	let { formData }: Props = $props();

	let { form, enhance, errors, submit } = superForm(formData, {
		dataType: 'json',
		resetForm: false,
		validators: zod4Client(feedbackSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Feedback sent successfully!');
			} else if (result.type === 'failure') {
				toast.error('Failed to send feedback.');
			} else if (result.type === 'error') {
				toast.error(result.error?.text ?? 'Filed to send feedback.');
			}
		}
	});

	let uuid = getAnonymousUUIDStore();
</script>

<dialog id="feedback-modal" class="modal">
	<div class="modal-box bg-base-300">
		<h1 class="text-center text-3xl font-bold">Feedback</h1>
		<form method="POST" action="/api/feedback" use:enhance class="flex w-full flex-col gap-2 p-4">
			<label class="select w-full">
				<span class="label">Tag</span>
				<select bind:value={$form.tag}>
					{#each feedbackTags as tag}
						<option value={tag}>{_.startCase(tag)}</option>
					{/each}
				</select>
			</label>
			<fieldset class="fieldset w-full">
				<textarea class="textarea w-full" bind:value={$form.text}></textarea>
				<div class="label">Message length: {$form.text.length}/1000</div>
			</fieldset>
			<label class="input w-full">
				<span class="label">Contact Info</span>
				<input
					type="text"
					placeholder="(Optional)"
					bind:value={
						() => $form.contactInfo || '',
						(v) => (v === '' ? ($form.contactInfo = undefined) : ($form.contactInfo = v))
					}
				/>
			</label>
			<input
				tabindex={-1}
				autocomplete="off"
				type="hidden"
				name="honeypot"
				bind:value={$form.honeypot}
				class="hidden"
			/>
			<button
				class="btn btn-success"
				onclick={() => {
					submit();
				}}
			>
				Send Feedback
			</button>
			<div class="card bg-base-100 p-2">
				<p>
					If you’d like us to contact you about your feedback, please leave your email or Discord ID
					(optional).
				</p>
				<div class="divider"></div>
				<p>
					The feedback text area supports
					<a
						class="link link-hover link-info"
						href="https://www.markdownguide.org/basic-syntax/"
						target="_blank"
					>
						Markdown
					</a>
					formatting!
				</p>
			</div>
		</form>
		<div class="modal-action">
			<button
				class="btn btn-info"
				type="button"
				onclick={() => {
					(document.getElementById('feedback-modal') as HTMLDialogElement)?.close();
				}}>Close</button
			>
		</div>
	</div>
</dialog>
