<script lang="ts">
	import type { PageProps } from './$types';
	import { Calendar, Edit, Eye, EyeOff, Trash2, Plus, Info } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data }: PageProps = $props();

	function formatDatecode(year: number, week: number): string {
		return `${year}${week.toString().padStart(2, '0')}`;
	}

	function handleTogglePreview(scheduleId: string, currentPreview: boolean) {
		if (!window.confirm(`Are you sure you want to ${currentPreview ? 'hide' : 'publish'} this schedule?`)) {
			return;
		}
		
		const form = document.getElementById(`preview-form-${scheduleId}`) as HTMLFormElement;
		form?.requestSubmit();
	}

	function handleDelete(scheduleId: string, year: number, week: number) {
		if (!window.confirm(`Are you sure you want to delete the schedule for ${year} Week ${week}?`)) {
			return;
		}
		if (!window.confirm('This action cannot be undone. Are you really sure?')) {
			return;
		}
		
		const form = document.getElementById(`delete-form-${scheduleId}`) as HTMLFormElement;
		form?.requestSubmit();
	}
</script>

<svelte:head>
	<title>Schedules | G.O.T Archive</title>
</svelte:head>

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
								<form
									id="preview-form-{schedule.scheduleId}"
									method="POST"
									action="?/togglePreview"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
											await invalidateAll();
										};
									}}
								>
									<input type="hidden" name="scheduleId" value={schedule.scheduleId} />
									<input type="hidden" name="preview" value={!schedule.preview} />
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
								</form>

								<!-- Delete -->
								<form
									id="delete-form-{schedule.scheduleId}"
									method="POST"
									action="?/deleteSchedule"
									use:enhance={() => {
										return async ({ update }) => {
											await update();
											await invalidateAll();
										};
									}}
								>
									<input type="hidden" name="scheduleId" value={schedule.scheduleId} />
									<button
										type="button"
										class="btn btn-sm btn-square btn-error"
										title="Delete"
										onclick={() => handleDelete(schedule.scheduleId, schedule.year, schedule.week)}
									>
										<Trash2 class="size-4" />
									</button>
								</form>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
