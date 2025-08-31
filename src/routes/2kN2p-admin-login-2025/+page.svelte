<script lang="ts">
	import { Button } from '$lib/components/forms';
</script>

<svelte:head>
	<title>Login | G.O.T Archive</title>
</svelte:head>

<div class="card bg-base-300 mx-auto my-auto w-md items-center">
	<div class="card-body w-full items-center">
		<h1 class="card-title p-2 text-3xl font-bold">Login</h1>
		<form class="flex w-full" method="POST" action="?/login">
			<button class="btn btn-success btn-block" type="submit"> Login with Google </button>
		</form>
		<div class="mt-4 flex flex-col justify-center">
			<span class="text-center">Currently, login is only available for app admins</span>
			<span class="text-center">Sign-ups maybe enabled in the future! Stay tuned!</span>
		</div>
	</div>
</div>
