<script lang="ts">
	import type { PageProps } from './$types';
	import { errorMessage } from '$lib/errors';
	import { Calendar, Edit, EyeOff, Globe, Info, Plus, Trash2 } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';
	import { deleteSchedule, togglePreview } from '$lib/remote/schedule.remote';
	import { notification } from '$lib/components/ui/toaster';
	import { bbcodeToText } from '$lib/util/bbcode';

	let { data }: PageProps = $props();

	function formatDatecode(year: number, week: number): string {
		return `${year}${week.toString().padStart(2, '0')}`;
	}

	async function handleTogglePreview(scheduleId: string, currentPreview: boolean) {
		if (
			!window.confirm(
				`Are you sure you want to ${currentPreview ? 'publish' : 'unpublish'} this schedule?`
			)
		) {
			return;
		}

		try {
			await togglePreview({ scheduleId, preview: !currentPreview });
			notification.success('Schedule visibility updated');
			await invalidateAll();
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to update schedule visibility'));
		}
	}

	async function handleDelete(scheduleId: string, year: number, week: number) {
		if (!window.confirm(`Are you sure you want to delete the schedule for ${year} Week ${week}?`)) {
			return;
		}
		if (!window.confirm('This action cannot be undone. Are you really sure?')) {
			return;
		}

		try {
			await deleteSchedule({ scheduleId });
			notification.success('Schedule deleted successfully');
			await invalidateAll();
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to delete schedule'));
		}
	}
</script>

<svelte:head>
	<title>Schedules | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-7xl p-2 md:p-4">
	<!-- Header -->
	<div class="mb-4">
		<h1 class="text-center text-2xl font-bold md:text-3xl">Schedules</h1>
		<p class="text-base-content/70 mt-2 text-center">Manage weekly anime schedules</p>
	</div>

	<!-- Create -->
	<a href="/admin/schedule/new" class="btn btn-primary mb-4 w-full">
		<Plus class="size-4" />
		Create New Schedule
	</a>

	<!-- List -->
	{#if data.schedules.length === 0}
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4">
				<div
					class="rounded-box border-base-content/20 bg-base-300/30 text-base-content/60 flex items-center gap-2 border border-dashed p-4"
				>
					<Info class="size-5" />
					<span>No schedules yet. Create your first schedule to get started.</span>
				</div>
			</div>
		</div>
	{:else}
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4">
				<h2 class="card-title mb-2 text-lg">
					<Calendar class="size-5" />
					All Schedules
				</h2>

				<div class="list rounded-box">
					{#each data.schedules as schedule}
						{@const datecode = formatDatecode(schedule.year, schedule.week)}

						<div class="list-row items-center">
							<div class="flex items-center gap-2">
								<span class="text-lg font-bold">{schedule.year}</span>
								<span class="text-base-content/60"
									>W{schedule.week.toString().padStart(2, '0')}</span
								>
							</div>

							<span class="badge {schedule.preview ? 'badge-warning' : 'badge-success'}">
								{schedule.preview ? 'Draft' : 'Published'}
							</span>

							{#if schedule.note}
								<span class="text-base-content/70 list-col-grow truncate text-sm"
									>{bbcodeToText(schedule.note)}</span
								>
							{:else}
								<span class="list-col-grow"></span>
							{/if}

							<!-- Actions -->
							<div class="flex gap-2">
								<a
									href="/admin/schedule/{datecode}/edit"
									class="btn btn-sm btn-square btn-neutral tooltip"
									data-tip="Edit {schedule.year} Week {schedule.week}"
									title="Edit"
								>
									<Edit class="size-4" />
								</a>

								<button
									type="button"
									class="btn btn-sm btn-square tooltip {schedule.preview
										? 'btn-success'
										: 'btn-warning'}"
									data-tip={schedule.preview ? 'Publish' : 'Unpublish'}
									onclick={() => handleTogglePreview(schedule.scheduleId, schedule.preview)}
								>
									{#if schedule.preview}
										<Globe class="size-4" />
									{:else}
										<EyeOff class="size-4" />
									{/if}
								</button>

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
