<script lang="ts">
	import type { PageProps } from './$types';
	import { errorMessage } from '$lib/errors';
	import { invalidateAll } from '$app/navigation';
	import { notification } from '$lib/components/ui/toaster';
	import { modalUtils } from '$lib/components/util';
	import {
		createDiscordTarget,
		deleteDiscordTarget,
		updateDiscordTarget
	} from '$lib/remote/discord.remote';
	import { TIME_ZONE_OPTIONS } from '$lib/api/schedule/timezone';
	import { Pencil, Plus, Server, Trash2 } from 'lucide-svelte';

	let { data }: PageProps = $props();

	const MODAL_ID = 'discord-target-modal';

	type MentionType = 'none' | 'everyone' | 'role';

	let editingId = $state<string | null>(null);
	let label = $state('');
	let guildId = $state('');
	let channelId = $state('');
	let timeZone = $state('Europe/London');
	let mentionType = $state<MentionType>('none');
	let mentionRoleId = $state('');
	let enabled = $state(true);
	let saving = $state(false);

	const isEditing = $derived(editingId !== null);

	function mentionLabelFor(type: string, roleId: string | null): string {
		if (type === 'everyone') return '@everyone';
		if (type === 'role') return roleId ? `<@&${roleId}>` : 'role (no id)';
		return 'no ping';
	}

	function openCreate() {
		editingId = null;
		label = '';
		guildId = '';
		channelId = '';
		timeZone = 'Europe/London';
		mentionType = 'none';
		mentionRoleId = '';
		enabled = true;
		modalUtils.openModal(MODAL_ID);
	}

	function openEdit(target: (typeof data.targets)[number]) {
		editingId = target.targetId;
		label = target.label;
		guildId = target.guildId;
		channelId = target.channelId;
		timeZone = target.timeZone;
		mentionType = target.mentionType as MentionType;
		mentionRoleId = target.mentionRoleId ?? '';
		enabled = target.enabled;
		modalUtils.openModal(MODAL_ID);
	}

	async function save() {
		saving = true;
		try {
			const payload = {
				guildId: guildId.trim(),
				channelId: channelId.trim(),
				label: label.trim(),
				timeZone: timeZone.trim(),
				mentionType,
				mentionRoleId: mentionRoleId.trim() || null,
				enabled
			};

			if (editingId) {
				await updateDiscordTarget({ targetId: editingId, ...payload });
			} else {
				await createDiscordTarget(payload);
			}

			notification.success(isEditing ? 'Target updated' : 'Target added');
			modalUtils.closeModal(MODAL_ID);
			await invalidateAll();
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to save target'));
		} finally {
			saving = false;
		}
	}

	async function remove(target: (typeof data.targets)[number]) {
		if (!window.confirm(`Delete target "${target.label}"?`)) return;

		try {
			await deleteDiscordTarget({ targetId: target.targetId });
			notification.success('Target deleted');
			await invalidateAll();
		} catch (e) {
			notification.error(errorMessage(e, 'Failed to delete target'));
		}
	}
</script>

<svelte:head>
	<title>Discord Targets | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto flex max-w-6xl flex-col gap-2 p-2 md:p-4">
	<div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
		<div>
			<h1 class="text-2xl font-bold md:text-3xl">Discord Schedule Targets</h1>
		</div>
		<button class="btn btn-primary btn-sm" onclick={openCreate}>
			<Plus class="size-4" /> Add target
		</button>
	</div>

	{#if data.targets.length === 0}
		<div class="card bg-base-200">
			<div class="card-body items-center text-center">
				<Server class="text-base-content/40 size-8" />
				<p class="text-base-content/70">No Discord targets yet.</p>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-2">
			{#each data.targets as target (target.targetId)}
				<div class="card bg-base-200">
					<div class="card-body gap-2 p-4">
						<div class="flex flex-wrap items-center justify-between gap-2">
							<div class="flex items-center gap-2">
								<span
									class="badge {target.enabled
										? 'badge-success'
										: 'badge-error'} badge-lg badge-outline w-20 font-semibold"
								>
									{target.enabled ? 'Enabled' : 'Disabled'}
								</span>
								<span class="text-xl font-semibold">{target.label}</span>
							</div>
							<div class="flex gap-1">
								<button
									class="btn btn-ghost btn-xs"
									aria-label="Edit target"
									onclick={() => openEdit(target)}
								>
									<Pencil class="size-4" />
								</button>
								<button
									class="btn btn-ghost btn-xs text-error"
									aria-label="Delete target"
									onclick={() => remove(target)}
								>
									<Trash2 class="size-4" />
								</button>
							</div>
						</div>
						<div class="text-base-content/70 grid grid-cols-[auto_1fr] gap-2">
							<span class="w-full">Guild ID</span>
							<span>{target.guildId}</span>
							<span class="w-full">Channel ID</span>
							<span>{target.channelId}</span>
							<span class="w-full">Time Zone</span>
							<span>{target.timeZone}</span>
							<span class="w-full">Ping</span>
							<span>{mentionLabelFor(target.mentionType, target.mentionRoleId)}</span>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<dialog id={MODAL_ID} class="modal">
	<div class="modal-box">
		<h3 class="mb-4 text-lg font-bold">{isEditing ? 'Edit target' : 'Add target'}</h3>

		<div class="flex flex-col gap-3">
			<label class="floating-label">
				<span>Label</span>
				<input class="input w-full" bind:value={label} placeholder="Mods server" />
			</label>

			<label class="floating-label">
				<span>Guild id</span>
				<input class="input w-full" bind:value={guildId} placeholder="707563145530572840" />
			</label>

			<label class="floating-label">
				<span>Channel id</span>
				<input class="input w-full" bind:value={channelId} placeholder="123456789012345678" />
			</label>

			<label class="floating-label">
				<span>Time zone</span>
				<input class="input w-full" bind:value={timeZone} list="timezone-options" />
			</label>
			<datalist id="timezone-options">
				{#each TIME_ZONE_OPTIONS as zone (zone)}
					<option value={zone}></option>
				{/each}
			</datalist>

			<label class="floating-label">
				<span>Ping</span>
				<select class="select w-full" bind:value={mentionType}>
					<option value="none">No ping</option>
					<option value="everyone">@everyone</option>
					<option value="role">Role</option>
				</select>
			</label>

			{#if mentionType === 'role'}
				<label class="floating-label">
					<span>Role id</span>
					<input class="input w-full" bind:value={mentionRoleId} placeholder="123456789012345678" />
				</label>
			{/if}

			<label class="label cursor-pointer justify-start gap-3">
				<input type="checkbox" class="toggle" bind:checked={enabled} />
				<span class="label-text">Enabled</span>
			</label>
		</div>

		<div class="modal-action">
			<button class="btn btn-ghost" onclick={() => modalUtils.closeModal(MODAL_ID)}>Cancel</button>
			<button class="btn btn-primary" disabled={saving} onclick={save}>
				{#if saving}<span class="loading loading-spinner loading-sm"></span>{/if}
				Save
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
