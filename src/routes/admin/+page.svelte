<script lang="ts">
	import type { PageData } from './$types';
  import { authClient } from '$lib/auth';

	let { data }: { data: PageData } = $props();

	async function handleLogout() {
    await authClient.signOut();
	}
</script>

<svelte:head>
	<title>Admin Dashboard | G.O.T Archive</title>
</svelte:head>

<div class="flex flex-col gap-4 p-6">
	<div class="card bg-base-300 w-full shadow-xl">
		<div class="card-body">
			<div class="flex items-center justify-between">
				<div>
					<h2 class="card-title text-2xl">Welcome to Admin Dashboard</h2>
					<p class="text-base-content/70">Logged in as: {data.user?.email}</p>
					{#if data.user?.user_metadata?.role}
						<p class="badge badge-primary mt-2">Role: {data.user.user_metadata.role}</p>
					{/if}
				</div>
				<button class="btn btn-error" onclick={handleLogout}> Logout </button>
			</div>
		</div>
	</div>
</div>
