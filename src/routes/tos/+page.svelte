<script lang="ts">
	import { FileText, Shield, Mail, Calendar } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Terms of Service | G.O.T Archive</title>
	<meta
		name="description"
		content="Terms of Service for G.O.T Archive, explaining site usage and feedback guidelines."
	/>
</svelte:head>

<div class="container mx-auto max-w-3xl p-2 md:p-4">
	<h1 class="text-2xl md:text-3xl font-bold text-center mb-2 md:mb-4">Terms of Service</h1>

	<div class="flex flex-col gap-2">
		<!-- Welcome -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<FileText class="h-5 w-5" />
					Welcome to G.O.T Archive!
				</h2>
				<div class="space-y-2 text-sm md:text-base">
					<p>
						By using this website, you agree to the following terms and conditions. Please read
						them carefully.
					</p>
				</div>
			</div>
		</div>

		<!-- Terms & Usage -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<Shield class="h-5 w-5" />
					Terms & Usage
				</h2>
				<ul class="list-disc list-inside space-y-2 text-sm md:text-base">
					<li>You can browse the site and send feedback.</li>
					<li>We don't collect personal info or make user accounts.</li>
					<li>
						Site content is for community fun and info—please don't copy it for business stuff.
					</li>
					<li>Using this site means you're okay with these simple rules.</li>
				</ul>
			</div>
		</div>

		<!-- Contact -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<Mail class="h-5 w-5" />
					Contact
				</h2>
				<p class="text-sm md:text-base">
					If you have questions, feel free to reach out via email:
				</p>
				<div class="flex items-center gap-2 mt-1">
					<a
						href="mailto:tekku.dev@proton.me"
						class="link link-primary text-sm md:text-base"
					>
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
				<p class="text-sm md:text-base">2026-03-07</p>
			</div>
		</div>
	</div>
</div>
