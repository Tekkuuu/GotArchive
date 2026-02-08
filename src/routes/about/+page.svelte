<script lang="ts">
	import { Coffee, MessageCircle, Heart, Code } from 'lucide-svelte';
</script>

<svelte:head>
	<title>About | G.O.T Archive</title>
	<meta
		name="description"
		content="Learn about the G.O.T Archive project, its purpose, and how you can support it."
	/>
</svelte:head>

<div class="container mx-auto max-w-3xl p-2 md:p-4">
	<h1 class="text-2xl md:text-3xl font-bold text-center mb-2 md:mb-4">About This Project</h1>

	<div class="flex flex-col gap-2">
		<!-- Why I Built This -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<Code class="h-5 w-5" />
					Why I Built This
				</h2>
				<div class="space-y-2 text-sm md:text-base">
					<p>
						Hi! I am Tekku, and I made this little website to gather all of G.O.T's reactions in one
						place.
					</p>
					<p>
						Searching for videos on YouTube or Patreon was annoying, at least for me, so I decided
						to make this website and organize it a little.
					</p>
				</div>
			</div>
		</div>

		<!-- Get in Touch -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<MessageCircle class="h-5 w-5" />
					Get in Touch
				</h2>
				<p class="text-sm md:text-base">
					If you have any questions, suggestions, or just want to chat, feel free to reach out on
					Discord!
				</p>
				<div class="flex items-center gap-2 mt-1">
					<span class="text-sm md:text-base">Username:</span>
					<span class="badge badge-primary badge-lg">tekkuuu</span>
				</div>
			</div>
		</div>

		<!-- Supporting the Site -->
		<div class="card bg-base-200 shadow-md">
			<div class="card-body p-4 md:p-6">
				<h2 class="card-title text-lg md:text-xl flex items-center gap-2">
					<Heart class="h-5 w-5" />
					Supporting the Site
				</h2>
				<div class="space-y-2 text-sm md:text-base">
					<p>
						Of course whether this website stays depends heavily on the hosting costs, since I run
						it all by myself. For now, the website is hosted on generous free/starter tiers and consts me 6.15$ a month.
					</p>
					<p>
						If you find this website useful and want to keep using it, I would appreciate any
						help! Since I'm a Uni student, money can get tight, even with part time job. I would love to
						continue working on this website. Even though webdev is not my end goal in IT, I still have
						a lot of fun doing this.
					</p>
					<div
						class="alert bg-base-300 border-primary/20 text-sm md:text-base p-2 md:p-3 mt-2"
					>
						<Heart class="h-4 w-4 shrink-0" />
						<span>
							Of course, if you decide to donate, the money will primarily go towards keeping the
							website alive. But food is also important 😉
						</span>
					</div>
				</div>

				<!-- Ko-fi Button -->
				<div class="flex justify-center mt-4 md:mt-6">
					<a
						href="https://ko-fi.com/L4L21JDMX3"
						target="_blank"
						rel="noopener noreferrer"
						class="btn btn-primary gap-2"
					>
						<Coffee class="h-5 w-5" />
						<span>Support on Ko-fi</span>
					</a>
				</div>
			</div>
		</div>
	</div>
</div>
