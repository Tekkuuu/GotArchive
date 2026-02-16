<script lang="ts">
	import { Shield, Eye, Cookie, Lock, Database, Mail, Calendar } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Privacy Policy | G.O.T Archive</title>
	<meta
		name="description"
		content="Privacy Policy for G.O.T Archive, detailing data collection, usage, and user rights."
	/>
</svelte:head>

<div class="container mx-auto max-w-3xl p-2 md:p-4">
	<h1 class="text-2xl md:text-3xl font-bold text-center mb-2 md:mb-4">Privacy Policy</h1>

	<div class="flex flex-col gap-2">
		<!-- Introduction -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<Shield class="h-5 w-5" />
					Your Privacy Matters
				</h2>
				<div class="space-y-2 text-sm md:text-base">
					<p>
						We care about your privacy! You have choices about what information you share and how
						your feedback and site activity are handled.
					</p>
				</div>
			</div>
		</div>

		<!-- No Personal Data Required -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<Eye class="h-5 w-5" />
					No Personal Data Required
				</h2>
				<div class="space-y-2 text-sm md:text-base">
					<p>You can use this site without logging in or sharing personal information.</p>
					<p>Feedback is sent anonymously via discord bot to the admins.</p>
				</div>
			</div>
		</div>

		<!-- Error & Crash Reporting -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<Database class="h-5 w-5" />
					Error and Crash Reporting
				</h2>
				<p class="text-sm md:text-base">
					We use Logwell (self-hosted) to collect anonymous error and crash reports to help us
					fix bugs and improve the site. All logs are stored on our own servers.
				</p>
			</div>
		</div>

		<!-- Cookies & Storage -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
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
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<Lock class="h-5 w-5" />
					Data Access & Security
				</h2>
				<ul class="list-disc list-inside space-y-2 text-sm md:text-base">
					<li>Only the site admin(s) can view feedback and error reports.</li>
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
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<Mail class="h-5 w-5" />
					Questions?
				</h2>
				<p class="text-sm md:text-base">
					If you have any privacy questions or want your data deleted, feel free to reach out via
					email:
				</p>
				<div class="flex items-center gap-2 mt-1">
					<a href="mailto:tekku.dev@proton.me" class="link link-primary text-sm md:text-base">
						tekku.dev@proton.me
					</a>
				</div>
			</div>
		</div>

		<!-- Last Updated -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<Calendar class="h-5 w-5" />
					Last Updated
				</h2>
				<p class="text-sm md:text-base">2026-02-08</p>
			</div>
		</div>
	</div>
</div>
