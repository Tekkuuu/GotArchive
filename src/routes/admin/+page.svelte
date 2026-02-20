<script lang="ts">
	import { Cog, Calendar, Film, Clock } from 'lucide-svelte';

	const adminRoutes = [
		{
			category: 'Manage',
			icon: Cog,
			routes: [
				{ 
					name: 'Anime', 
					href: '/admin/anime', 
					description: 'Manager anime series and seasons',
					icon: Film
				},
				{ 
					name: 'Schedule', 
					href: '/admin/schedule/new', 
					description: 'Manage schedules',
					icon: Calendar
				},
				{ 
					name: 'Schedule Slots', 
					href: '/admin/schedule/slots', 
					description: 'Manage schedule slots',
					icon: Clock
				}
			]
		},
	];
</script>

<svelte:head>
	<title>Admin Dashboard | G.O.T Archive</title>
</svelte:head>

<div class="container mx-auto max-w-6xl p-4">
	<!-- Page Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold text-center">Admin Dashboard</h1>
		<p class="text-base-content/70 mt-2 text-center">
			Manage content and settings for G.O.T Archive
		</p>
	</div>

	<!-- Admin Sections -->
	<div class="flex flex-col">
		{#each adminRoutes as section}
			<div class="card bg-base-200 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">
            <section.icon class="size-5" />
						{section.category}
					</h2>
					<div class="flex flex-col gap-3">
						{#each section.routes as route}
							<a href={route.href} class="card bg-base-300 hover:bg-primary transition-colors">
								<div class="card-body">
									<div class="flex items-start gap-3">
										<div class="mt-1">
											<route.icon class="size-5" />
										</div>
										<div class="flex-1">
											<h3 class="font-semibold">{route.name}</h3>
											<p class="text-sm text-base-content/70 mt-1">
												{route.description}
											</p>
										</div>
									</div>
								</div>
							</a>
						{/each}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
