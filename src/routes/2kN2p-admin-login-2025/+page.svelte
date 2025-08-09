<script lang="ts">
	import { Button } from '$lib/components/forms';
</script>

<svelte:head>
	<title>Login | G.O.T Archive</title>
</svelte:head>

<div class="flex flex-col items-center justify-center gap-1">
	<h1 class="text-primary-900 dark:text-primary-50 p-2 text-3xl font-bold">Login</h1>
	<form class="flex w-2/3 flex-col gap-1" method="POST" action="?/login">
		<Button variant="submit" type="submit" filled fullWidth>
			<span class="font-bold">Login with Google</span>
		</Button>
	</form>
	<div class="text-primary-900 dark:text-primary-50 flex flex-col justify-center border-b p-2">
		<span class="text-center">Currently, login is only available for app admins</span>
		<span class="text-center">Sign-ups maybe enabled in the future! Stay tuned!</span>
	</div>
</div>
