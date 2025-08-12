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

	let { form, enhance, errors } = superForm(formData, {
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
	let includeUUID = $state(true);

	$effect(() => {
		if (includeUUID) {
			$form.anonymousUUID = uuid.value;
		} else {
			$form.anonymousUUID = undefined;
		}
	});
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
			<div class="grid grid-cols-[1fr_auto] gap-1">
				<Input
					fullWidth
					rounded="lg"
					name="uuid"
					type="text"
					disabled
					placeholder="UUID (optional)"
					bind:value={
						() => $form.anonymousUUID || '',
						(v) => (v === '' ? ($form.anonymousUUID = undefined) : ($form.anonymousUUID = v))
					}
				>
					<LucideIcon icon={Fingerprint} />
				</Input>
				<Checkbox shape="rounded" bind:value={includeUUID} />
			</div>
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
			<Button type="submit" variant="submit" shape="rounded" filled fullWidth>
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
					<a href="/privacy" class="text-success cursor-pointer font-bold underline">UUID</a> is optional
					and anonymous.
				</p>
				<p>It helps us track feedback and issues from the same user over time.</p>
				<p>Opt-out via checkbox</p>
				<p>
					If you want us to contact you back about the feedback, leave your email/discord id so we
					can reach out to you!
				</p>
				<p>
					Text text area supports <a
						class="text-info hover:text-info-light underline transition-all duration-150"
						href="https://www.markdownguide.org/basic-syntax/"
						target="_blank">markdown</a
					> ;)
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
