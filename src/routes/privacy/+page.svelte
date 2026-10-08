<script lang="ts">
	import { Shield, Eye, Cookie, Lock, Mail, Calendar } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Privacy Policy | G.O.T Archive</title>
	<meta
		name="description"
		content="Privacy Policy for G.O.T Archive, detailing data collection, usage, and user rights."
	/>
</svelte:head>

<div class="container mx-auto max-w-3xl p-2 md:p-4">
	<h1 class="mb-2 text-center text-2xl font-bold md:mb-4 md:text-3xl">Privacy Policy</h1>

	<div class="flex flex-col gap-2">
		<!-- Introduction -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title flex items-center gap-2 text-lg md:text-xl">
					<Shield class="h-5 w-5" />
					Your Privacy Matters
				</h2>
				<div class="space-y-2 text-sm md:text-base">
					<p>
						Currently we don't collect any personal data from users. We only collect error reports
						with browser and device info attached.
					</p>
				</div>
			</div>
		</div>

		<!-- No Personal Data Required -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title flex items-center gap-2 text-lg md:text-xl">
					<Eye class="h-5 w-5" />
					No Personal Data Required
				</h2>
				<div class="space-y-2 text-sm md:text-base">
					<p>You can use this site without logging in or sharing personal information.</p>
				</div>
			</div>
		</div>

		<!-- Cookies & Storage -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title flex items-center gap-2 text-lg md:text-xl">
					<Cookie class="h-5 w-5" />
					Cookies & Browser Storage
				</h2>
				<div class="space-y-2 text-sm md:text-base">
					<p>
						We only use cookies for admin login (authentication). For other features, we may store
						data in your browser's localStorage.
					</p>
					<p>
						If you want to remove stored data, you can clear your browser storage for this site.
					</p>
					<p>
						For convenience, we may store some preferences and cached images in your browser. This
						data is never sent to our servers, shared, or used for tracking.
					</p>
				</div>
			</div>
		</div>

		<!-- Data Access & Security -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title flex items-center gap-2 text-lg md:text-xl">
					<Lock class="h-5 w-5" />
					Data Access & Security
				</h2>
				<ul class="list-inside list-disc space-y-2 text-sm md:text-base">
					<li>We do not use third-party analytics or ads.</li>
					<li>We do not share your data with anyone.</li>
					<li>
						Admin accounts use cookies to keep you logged in securely using Google authentication.
						Admin email addresses are never shown publicly.
					</li>
				</ul>
			</div>
		</div>

		<!-- Questions -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title flex items-center gap-2 text-lg md:text-xl">
					<Mail class="h-5 w-5" />
					Questions?
				</h2>
				<p class="text-sm md:text-base">
					If you have any privacy questions or want your data deleted, feel free to reach out via
					email:
				</p>
				<div class="mt-1 flex items-center gap-2">
					<a href="mailto:tekku.dev@proton.me" class="link link-primary text-sm md:text-base">
						tekku.dev@proton.me
					</a>
				</div>
			</div>
		</div>

		<!-- Last Updated -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title flex items-center gap-2 text-lg md:text-xl">
					<Calendar class="h-5 w-5" />
					Last Updated
				</h2>
				<p class="text-sm md:text-base">2026-03-07</p>
			</div>
		</div>
	</div>
</div>
