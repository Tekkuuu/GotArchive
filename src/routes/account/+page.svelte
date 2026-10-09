<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import { authClient } from '$lib/auth';
	import { notification } from '$lib/components/ui/toaster';
	import { openModal, closeModal } from '$lib/components/util/modal';
	import { KeyRound, Link2, Unlink } from 'lucide-svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const unlinkModalId = 'unlink-discord-modal';

	let linking = $state(false);
	let unlinking = $state(false);

	const user = $derived(data.session?.user);
	const role = $derived((user as { role?: string } | undefined)?.role ?? 'user');
	const discordAccount = $derived(
		data.accounts.find((account) => account.providerId === 'discord')
	);

	const initials = $derived(
		(user?.name ?? '?')
			.split(' ')
			.map((part) => part[0])
			.filter(Boolean)
			.slice(0, 2)
			.join('')
			.toUpperCase()
	);

	const OAUTH_ERRORS: Record<string, string> = {
		email_does_not_match: 'That Discord account uses a different email than your account.',
		unable_to_link_account: 'That Discord account could not be linked.',
		account_already_linked_to_different_user:
			'That Discord account is already linked to someone else.',
		email_not_found: 'Discord did not share an email address with us.',
		email_not_verified: 'Your Discord email is not verified.',
		invalid_code: 'The Discord authorization expired. Please try again.',
		oauth_provider_not_found: 'Discord linking is not configured.'
	};

	onMount(() => {
		const error = page.url.searchParams.get('error');
		if (error) {
			notification.error(OAUTH_ERRORS[error] ?? 'Discord linking failed. Please try again.');
			const url = new URL(page.url);
			url.searchParams.delete('error');
			window.history.replaceState({}, '', url);
		}
	});

	async function linkDiscord() {
		linking = true;
		try {
			const result = await authClient.linkSocial({
				provider: 'discord',
				callbackURL: '/account',
				errorCallbackURL: '/account?error=unable_to_link_account',
				scopes: ['identify', 'email']
			});
			if (result.error) {
				notification.error(result.error.message || 'Could not start Discord linking.');
			}
		} catch {
			notification.error('Could not start Discord linking.');
		} finally {
			linking = false;
		}
	}

	async function confirmUnlink() {
		if (!discordAccount) return;

		unlinking = true;
		try {
			const result = await authClient.unlinkAccount({ accountId: discordAccount.id });
			if (result.error) {
				const code = (result.error as { code?: string }).code;
				if (code === 'SESSION_NOT_FRESH') {
					notification.error('For security, please sign out and sign back in before unlinking.');
				} else if (code === 'FAILED_TO_UNLINK_LAST_ACCOUNT') {
					notification.error('This is your only sign-in method, so it cannot be unlinked.');
				} else {
					notification.error(result.error.message || 'Could not unlink Discord.');
				}
				return;
			}
			closeModal(unlinkModalId);
			notification.success('Discord account unlinked.');
			await invalidateAll();
		} catch {
			notification.error('Could not unlink Discord.');
		} finally {
			unlinking = false;
		}
	}
</script>

<svelte:head>
	<title>Account | G.O.T Archive</title>
	<meta name="description" content="Manage your G.O.T Archive account and linked services." />
</svelte:head>

<div class="mx-auto flex w-full max-w-6xl flex-col gap-2 p-4">
	<!-- Profile -->
	<section class="card bg-base-200 shadow-sm">
		<div class="card-body">
			<h2 class="card-title text-lg">Profile</h2>
			<div class="flex items-center gap-4">
				<div class="avatar avatar-placeholder">
					<div class="bg-primary text-primary-content w-14 rounded-full">
						<span class="text-xl">{initials}</span>
					</div>
				</div>
				<div class="flex w-full min-w-0 flex-col md:flex-row">
					<div
						class="flex w-full min-w-0 flex-col gap-2 max-md:justify-center md:flex-row md:items-center"
					>
						<span class="shrink-0 text-xl font-semibold">{user?.name}</span>
						<span class="text-base-content/70 w-full min-w-0 truncate text-xl">{user?.email}</span>
					</div>
				</div>
			</div>
			<div class="mt-2 flex shrink-0 flex-wrap gap-2">
				{#if user?.emailVerified}
					<span class="badge badge-success badge-xl"> Verified </span>
				{/if}
				{#if role !== 'user'}
					<span class="badge badge-primary badge-xl">{role}</span>
				{/if}
			</div>
		</div>
	</section>

	<!-- Linked accounts -->
	<section class="card bg-base-200 shadow-sm">
		<div class="card-body">
			<h2 class="card-title text-lg">Linked accounts</h2>

			<ul class="mt-2 flex flex-col gap-2">
				<!-- Email & password -->
				<li class="bg-base-300 rounded-box flex flex-wrap items-center gap-2 p-4">
					<span
						class="bg-base-content/10 flex size-10 shrink-0 items-center justify-center rounded-full"
					>
						<KeyRound class="size-5" />
					</span>
					<div class="min-w-0 grow">
						<p class="font-medium">Email &amp; password</p>
						<p class="text-base-content/70 truncate text-sm">{user?.email}</p>
					</div>
				</li>

				<!-- Discord -->
				<li class="bg-base-300 rounded-box flex flex-wrap items-center gap-2 p-4">
					<span
						class="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#5865f2] text-white"
					>
						<svg viewBox="0 0 24 24" fill="currentColor" class="size-5" aria-hidden="true">
							<path
								d="M20.317 4.369a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03ZM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.096 2.157 2.418 0 1.334-.956 2.419-2.157 2.419Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.096 2.157 2.418 0 1.334-.946 2.419-2.157 2.419Z"
							/>
						</svg>
					</span>
					<div class="min-w-0 grow">
						<p class="font-medium">Discord</p>
						{#if discordAccount}
							<p class="text-base-content/70 truncate text-sm">
								Connected as {discordAccount.accountId}
							</p>
						{:else if data.discordConfigured}
							<p class="text-base-content/70 text-sm">Not connected</p>
						{:else}
							<p class="text-base-content/70 text-sm">Unavailable — contact an admin.</p>
						{/if}
					</div>

					{#if discordAccount}
						<button
							class="btn btn-error btn-sm"
							onclick={() => openModal(unlinkModalId)}
							disabled={unlinking}
						>
							<Unlink class="size-4" />
							Unlink
						</button>
					{:else if data.discordConfigured}
						<button class="btn btn-sm" onclick={linkDiscord} disabled={linking}>
							{#if linking}
								<span class="loading loading-spinner loading-xs"></span>
							{:else}
								<Link2 class="size-4" />
							{/if}
							Link Discord
						</button>
					{/if}
				</li>
			</ul>
		</div>
	</section>
</div>

<!-- Unlink confirmation -->
<dialog id={unlinkModalId} class="modal">
	<div class="modal-box">
		<h3 class="text-lg font-bold">Unlink Discord?</h3>
		<p class="py-4 text-sm">
			Your G.O.T Archive account stays active, but it will no longer be connected to Discord.
		</p>
		<div class="modal-action">
			<button class="btn btn-ghost" onclick={() => closeModal(unlinkModalId)} disabled={unlinking}>
				Cancel
			</button>
			<button class="btn btn-error" onclick={confirmUnlink} disabled={unlinking}>
				{#if unlinking}
					<span class="loading loading-spinner loading-sm"></span>
				{/if}
				Unlink
			</button>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
