<svelte:head>
	<title>Privacy Policy | G.O.T Archive</title>
	<meta
		name="description"
		content="Privacy Policy for G.O.T Archive, detailing data collection, usage, and user rights."
	/>
</svelte:head>

<main class="bg-base-200 flex min-h-screen flex-col items-center justify-center px-4 py-12">
	<section class="card w-full max-w-2xl shadow-xl">
		<div class="card-body bg-base-100 rounded-lg">
			<h1 class="card-title mb-6 justify-center text-3xl">Privacy Policy</h1>

			<section class="prose prose-primary dark:prose-invert mb-8 max-w-none">
				<p>
					We care about your privacy! You have choices about what information you share and how your
					feedback and site activity are handled.
				</p>
				<ul class="list-inside list-disc space-y-3">
					<li>You can use this site without logging in or sharing personal information.</li>
					<li>
						<b>Feedback:</b> You may optionally provide contact information (such as email or Discord)
						if you would like a response to your feedback. If you do not provide contact info, your feedback
						is fully anonymous and cannot be linked to your site usage or identity.
					</li>
					<li>
						<b>How DAU (Daily Active Users) is logged:</b><br />
						We log the number of daily active users for statistical purposes using a random ID (UUID)
						stored in your browser <b>only if you accept the cookie consent banner</b>. Each day you
						visit, your UUID is added to that day's record. If you visit on multiple days, your UUID
						will appear in multiple daily records, but only for the most recent 7 days. These
						records are automatically deleted after 7 days. The only thing we keep permanently is
						the daily count of users (e.g., "2025-08-15: 123 users"), never the UUIDs themselves.<br
						/>
						This process helps us understand site usage patterns and does not identify you personally.
					</li>
					<li>
						<b>Feedback rate-limiting:</b> To prevent spam and abuse, we use an anonymous, randomly generated
						identifier (UUID) stored in your browser to limit feedback submissions to a maximum of 5
						per hour. This identifier is used exclusively for rate-limiting and is never stored with
						your feedback or used to identify you.
					</li>
					<li>
						<b>Error and Crash Reporting:</b>
						We use Sentry to collect error and crash reports. When an error happens, we may collect technical
						information about your browser or device (such as browser version, operating system, and
						approximate location), as well as information about the error itself. This only happens if
						the error occurs in your browser. No personal information (like your name or contact info)
						is included in these reports unless you have provided it in feedback.
					</li>
					<li>
						<b>Cookie & browser storage consent & your options:</b><br />
						We only use cookies for admin login (authentication). For other features, we may store data
						in your browser's localStorage.<br />
						A random ID (UUID) is stored in localStorage and used for feedback rate-limiting as a necessary
						security measure, even if you do not accept the consent banner. Other non-essential features—such
						as DAU tracking—use localStorage only if you accept the consent banner.<br />
						If you want to remove stored data, you can clear your browser storage for this site. (The
						UUID used for DAU tracking is stored for 7 days on our backend and then automatically deleted.
						In your browser, the UUID will remain in localStorage until you clear it; if you do, a new
						UUID will be generated on your next visit.)
					</li>
					<li>
						<b>Feedback data deletion:</b><br />
						If you want your feedback or contact info deleted, email us at
						<a href="mailto:tekku.dev@proton.me" class="link">tekku.dev@proton.me</a>. We routinely
						delete feedback after considering or implementing changes.
					</li>
					<li>
						<b>Who can see your data?</b><br />
						Only the site admin(s) can view feedback and error reports. User accounts (for admin access)
						are protected by secure authentication and never exposed to the public. All personal data
						is protected by strict access controls and database security rules.
					</li>
					<li>
						<b>No analytics or ads:</b> We do not use third-party analytics or ads, and we do not share
						your data with anyone.
					</li>
					<li>
						<b>Admin accounts:</b> If you are an admin, cookies are set to keep you logged in securely
						using Google authentication. Admin email addresses are never shown publicly.
					</li>
					<li>
						<b>Preferences & cached data:</b> For convenience, we may store some preferences and cached
						images in your browser. This data is never sent to our servers, shared, or used for tracking.
					</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="mb-2 text-xl font-semibold">Questions?</h2>
				<p>
					If you have any privacy questions or want your data deleted, email
					<a href="mailto:tekku.dev@proton.me" class="link link-info px-0 align-baseline">
						tekku.dev@proton.me
					</a>
				</p>
			</section>

			<footer class="text-base-content border-base-300 mt-6 border-t pt-6 text-center text-sm">
				Last updated: 2025-08-15
			</footer>
		</div>
	</section>
</main>
