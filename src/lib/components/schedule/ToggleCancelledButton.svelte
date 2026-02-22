<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import { ToggleCancelledSchema } from '$lib/schemas';
	import { invalidateAll } from '$app/navigation';
	import { notification } from '$lib/components/ui/toaster';
	import { AlertCircle } from 'lucide-svelte';

	interface Props {
		sForm: SuperValidated<Infer<typeof ToggleCancelledSchema>>;
		scheduleEntryId: string;
		isCancelled: boolean;
	}

	let { sForm, scheduleEntryId, isCancelled }: Props = $props();

	// svelte-ignore state_referenced_locally
	const { form, enhance } = superForm(sForm, {
		dataType: 'json',
		validators: zod4Client(ToggleCancelledSchema),
		multipleSubmits: 'prevent',
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				notification.success(isCancelled ? 'Entry uncancelled' : 'Entry cancelled');
				await invalidateAll();
			} else {
				notification.error('Failed to update entry');
			}
		}
	});
</script>

<form method="POST" action="?/toggleCancelled" use:enhance>
	<input type="hidden" bind:value={$form.scheduleEntryId} />
	<input type="hidden" bind:value={$form.isCancelled} />
	<button
		type="submit"
		class="btn btn-sm btn-square {isCancelled ? 'btn-warning' : 'btn-ghost'}"
		title={isCancelled ? 'Uncancel' : 'Cancel'}
		onclick={(e) => {
			e.preventDefault();
			if (!window.confirm(`Are you sure you want to ${isCancelled ? 'uncancel' : 'cancel'} this entry?`)) return;
			$form.scheduleEntryId = scheduleEntryId;
			$form.isCancelled = !isCancelled;
			e.currentTarget.closest('form')?.requestSubmit();
		}}
	>
		<AlertCircle class="size-4" />
	</button>
</form>
