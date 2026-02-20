<script lang="ts">
	import type { PageProps } from './$types';
	import { Calendar, Edit, Eye, EyeOff, Trash2, Plus, Info } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { DeleteScheduleSchema, TogglePreviewSchema } from '$lib/schemas';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { notification } from '$lib/components/ui/toaster';

	let { data }: PageProps = $props();

	// svelte-ignore state_referenced_locally
	const { form: deleteForm, enhance: deleteEnhance, submit: deleteSubmit } = superForm(data.deleteForm, {
		dataType: 'json',
		validators: zod4Client(DeleteScheduleSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: async ({ result }) => {
			if (result.type === 'success' || result.type === 'redirect') {
				notification.success('Schedule deleted successfully');
				await invalidateAll();
			} else if (result.type === 'failure') {
				notification.error(result.data?.error || 'Failed to delete schedule');
			}
		}
	});

	// svelte-ignore state_referenced_locally
	const { form: toggleForm, enhance: toggleEnhance, submit: toggleSubmit } = superForm(data.togglePreviewForm, {
		dataType: 'json',
		validators: zod4Client(TogglePreviewSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				notification.success('Schedule visibility updated');
				await invalidateAll();
			} else if (result.type === 'failure') {
				notification.error('Failed to update schedule visibility');
			}
		}
	});

	function formatDatecode(year: number, week: number): string {
		return `${year}${week.toString().padStart(2, '0')}`;
	}

	function handleTogglePreview(scheduleId: string, currentPreview: boolean) {
		if (!window.confirm(`Are you sure you want to ${currentPreview ? 'publish' : 'hide'} this schedule?`)) {
			return;
		}
		$toggleForm.scheduleId = scheduleId;
		$toggleForm.preview = !currentPreview;
    toggleSubmit();
	}

	function handleDelete(scheduleId: string, year: number, week: number) {
		if (!window.confirm(`Are you sure you want to delete the schedule for ${year} Week ${week}?`)) {
			return;
		}
		if (!window.confirm('This action cannot be undone. Are you really sure?')) {
			return;
		}
		$deleteForm.scheduleId = scheduleId;
    deleteSubmit();
	}
</script>

<svelte:head>
	<title>Schedules | G.O.T Archive</title>
</svelte:head>

<form
	id="delete-form"
	method="POST"
	action="?/deleteSchedule"
	use:deleteEnhance
	class="hidden"
>
  <input type="hidden" bind:value={$deleteForm.scheduleId} />
</form>

<form
	id="toggle-preview-form"
	method="POST"
	action="?/togglePreview"
	use:toggleEnhance
	class="hidden"
>
  <input type="hidden" bind:value={$toggleForm.scheduleId} />
  <input type="hidden" bind:value={$toggleForm.preview} />
</form>

<div class="container mx-auto max-w-7xl p-2 md:p-4">
	<!-- Page Header -->
	<div class="mb-4">
		<h1 class="text-2xl md:text-3xl font-bold text-center">Schedules</h1>
		<p class="text-base-content/70 mt-2 text-center">
			Manage weekly anime schedules
		</p>
	</div>

	<!-- Create New Button -->
	<a href="/admin/schedule/new" class="btn btn-primary w-full mb-4">
		<Plus class="h-4 w-4" />
		Create New Schedule
	</a>

	<!-- Schedules List -->
	{#if data.schedules.length === 0}
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4">
				<div
					class="border border-dashed rounded-box p-4 border-base-content/20 bg-base-300/30 text-base-content/60 gap-2 flex items-center"
				>
					<Info class="h-5 w-5" />
					<span>No schedules yet. Create your first schedule to get started.</span>
				</div>
			</div>
		</div>
	{:else}
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4">
				<h2 class="card-title text-lg mb-2">
					<Calendar class="h-5 w-5" />
					All Schedules
				</h2>

				<div class="list rounded-box">
					{#each data.schedules as schedule}
						{@const datecode = formatDatecode(schedule.year, schedule.week)}

						<div class="list-row items-center">
							<!-- Schedule Info -->
							<div class="flex items-center gap-2">
								<span class="font-bold text-lg">{schedule.year}</span>
								<span class="text-base-content/60">W{schedule.week.toString().padStart(2, '0')}</span>
							</div>

							<span class="badge {schedule.preview ? 'badge-error' : 'badge-success'}">
								{schedule.preview ? 'Draft' : 'Published'}
							</span>

							<!-- Note (if present) -->
							{#if schedule.note}
								<span class="text-sm text-base-content/70 truncate list-col-grow">{schedule.note}</span>
							{:else}
								<span class="list-col-grow"></span>
							{/if}

							<!-- Actions -->
							<div class="flex gap-2">
								<!-- Edit -->
								<a
									href="/admin/schedule/{datecode}/edit"
									class="btn btn-sm btn-square btn-neutral tooltip"
									data-tip="Edit {schedule.year} Week {schedule.week}"
									title="Edit"
								>
									<Edit class="size-4" />
								</a>

								<!-- Toggle Preview -->
								<button
									type="button"
									class="btn btn-sm btn-square tooltip {schedule.preview ? 'btn-ghost' : 'btn-success'}"
									data-tip={schedule.preview ? 'Publish to public' : 'Hide from public'}
									onclick={() => handleTogglePreview(schedule.scheduleId, schedule.preview)}
								>
									{#if schedule.preview}
										<Eye class="size-4" />
									{:else}
										<EyeOff class="size-4" />
									{/if}
								</button>

								<!-- Delete -->
								<button
									type="button"
									class="btn btn-sm btn-square btn-error tooltip"
									data-tip="Delete {schedule.year} Week {schedule.week}"
									onclick={() => handleDelete(schedule.scheduleId, schedule.year, schedule.week)}
								>
									<Trash2 class="size-4" />
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
