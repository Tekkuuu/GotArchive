<script>
	import { Ban } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Unauthorized | G.O.T Archive</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center p-6">
	<div class="card bg-base-300 w-full max-w-lg shadow-xl">
		<div class="card-body items-center text-center">
			<div class="mb-4 text-6xl">
				<Ban />
			</div>
			<h1 class="card-title text-3xl font-bold">Unauthorized Access</h1>
			<p class="text-base-content/70 mt-4">
				You don't have permission to access the admin dashboard. This area is restricted to admins
				and moderators only.
			</p>
			<div class="card-actions mt-6 flex gap-2">
				<a href="/" class="btn btn-primary">Go to Homepage</a>
			</div>
		</div>
	</div>
</div>
