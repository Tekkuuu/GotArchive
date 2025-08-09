<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/forms/';

	let showBanner = false;

	onMount(() => {
		// Check if user already accepted cookies
		showBanner = !localStorage.getItem('got_cookie_consent');
	});

	function acceptCookies() {
		localStorage.setItem('got_cookie_consent', 'true');
		showBanner = false;
	}
</script>

{#if showBanner}
	<div
		class="bg-primary-200 dark:bg-primary-700 text-primary-900 dark:text-primary-50 fixed right-0 bottom-0 left-0 z-50 flex flex-col items-center justify-between p-4 md:flex-row"
	>
		<div>
			G.O.T Archive uses cookies for admin login only. No tracking or advertising cookies are used.
		</div>
		<Button variant="warning" filled shape="rounded" onclick={acceptCookies}>
			<span class="font-bold">OK, got it!</span>
		</Button>
	</div>
{/if}
