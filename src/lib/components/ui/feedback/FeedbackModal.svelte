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

	interface Props {
		formData: SuperValidated<Infer<typeof feedbackSchema>>;
		open: boolean;
	}

	let { formData, open = $bindable() }: Props = $props();

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

{#if open}
	<div
		class={[
			'border-primary-300 dark:border-primary-700 bg-primary-50 dark:bg-primary-900 border',
			'fixed top-1/2 left-1/2 flex w-xs -translate-x-1/2 -translate-y-1/2 sm:w-xl',
			'flex-col items-center justify-center gap-1 rounded-lg'
		]}
	>
		<h1 class="dark:text-primary-50 text-primary-900 px-4 pt-4 text-3xl font-bold">Feedback</h1>
		<form method="POST" action="/api/feedback" use:enhance class="flex w-full flex-col gap-1 p-4">
			<input type="hidden" name="anonymousUUID" bind:value={$form.anonymousUUID} />
			<Select
				rounded
				options={feedbackTags.map((f) => ({ value: f, label: f }))}
				bind:selected={() => ({ value: $form.tag, label: $form.tag }), (v) => ($form.tag = v.value)}
			>
				<LucideIcon icon={Tag} />
			</Select>
			<Textarea cols="full" rounded="lg" fullWidth bind:value={$form.text}>
				<span class="flex items-center">
					<Text />
				</span>
			</Textarea>
			<span
				class={[
					'dark:bg-primary-700 bg-primary-200 col-span-2 rounded-lg',
					'text-primary-900 dark:text-primary-50',
					'p-1'
				]}
			>
				Message length: {$form.text.length}/1000
			</span>
			<Input
				fullWidth
				rounded="lg"
				name="contact_info"
				type="text"
				placeholder="Contact Info (Optional)"
				bind:value={
					() => $form.contactInfo || '',
					(v) => (v === '' ? ($form.contactInfo = undefined) : ($form.contactInfo = v))
				}
			>
				<LucideIcon icon={Mail} />
			</Input>
			<input
				tabindex={-1}
				autocomplete="off"
				type="hidden"
				name="honeypot"
				bind:value={$form.honeypot}
				class="hidden"
			/>
			<Button
				variant="submit"
				shape="rounded"
				filled
				fullWidth
				onclick={() => {
					$form.anonymousUUID = uuid.value;
					submit();
				}}
			>
				<span class="font-bold">Send Feedback</span>
			</Button>
			<span
				class={[
					'dark:bg-primary-700 bg-primary-200 col-span-2 rounded-lg',
					'text-primary-900 dark:text-primary-50',
					'p-1'
				]}
			>
				<p>
					If you’d like us to contact you about your feedback, please leave your email or Discord ID
					(optional).
				</p>
				<p>
					The feedback text area supports <a
						class="text-info hover:text-info-light underline transition-all duration-150"
						href="https://www.markdownguide.org/basic-syntax/"
						target="_blank">Markdown</a
					> formatting! &#128521;
				</p>
			</span>
		</form>
		<button
			class={[
				'dark:text-primary-50 text-primary-900 bg-primary-200 dark:bg-primary-700',
				'absolute top-4 right-4 rounded-lg p-2',
				'hover:bg-primary-300 dark:hover:bg-primary-600'
			]}
			type="button"
			onclick={(e) => {
				e.preventDefault();
				open = false;
			}}
		>
			<X />
		</button>
	</div>
{/if}
