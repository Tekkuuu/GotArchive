<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getCookieConsentStore,
		COOKIE_CONSENT_VERSION,
		getAnonymousUUIDStore
	} from '$lib/stores/';

	let cookieConsent = getCookieConsentStore();

	let showBanner = false;

	onMount(() => {
		if (
			cookieConsent.value.version === COOKIE_CONSENT_VERSION &&
			cookieConsent.value.consent === true
		) {
			// If consent is already given, hide the banner and send dau
			showBanner = false;
			let uuid = getAnonymousUUIDStore();
			if (cookieConsent.value.consent) {
				fetch('/api/dau', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						uuid: uuid.value
					})
				});
			}
		} else {
			showBanner = true;
			cookieConsent.set({ version: COOKIE_CONSENT_VERSION, consent: false });
		}
	});

	function acceptCookies() {
		showBanner = false;
		cookieConsent.set({ version: COOKIE_CONSENT_VERSION, consent: true });

		// If the consent is given, send the dau
		let uuid = getAnonymousUUIDStore();
		if (cookieConsent.value.consent) {
			fetch('/api/dau', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					uuid: uuid.value
				})
			});
		}
	}
</script>

{#if showBanner}
	<div
		class="bg-primary-200 dark:bg-primary-700 text-primary-900 dark:text-primary-50 fixed right-0 bottom-0 left-0 z-50 flex flex-col items-center justify-between p-4 md:flex-row"
	>
		<div>
			G.O.T Archive uses cookies for admin login only. No tracking or advertising cookies are used.
			<a
				href="/privacy"
				class="text-info dark:text-info hover:text-info-light dark:hover:text-info-light underline"
				>Read more</a
			>
		</div>
		<!-- <Button variant="warning" filled shape="rounded" onclick={acceptCookies}> -->
		<!-- 	<span class="font-bold">OK, got it!</span> -->
		<!-- </Button> -->
	</div>
{/if}
