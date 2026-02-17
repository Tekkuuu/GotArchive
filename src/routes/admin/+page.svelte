<script lang="ts">
	import type { PageData } from './$types';
	import { Plus, Pencil, Calendar, Film, LayoutGrid, Clock } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	const adminRoutes = [
		{
			category: 'Create New',
			icon: Plus,
			routes: [
				{ 
					name: 'New Anime', 
					href: '/admin/new/anime', 
					description: 'Add a new anime to the archive',
					icon: Film
				},
				{ 
					name: 'New Season', 
					href: '/admin/new/season', 
					description: 'Create a new season',
					icon: LayoutGrid
				},
				{ 
					name: 'New Schedule', 
					href: '/admin/schedule/new', 
					description: 'Create a new schedule entry',
					icon: Calendar
				}
			]
		},
		{
			category: 'Edit & Manage',
			icon: Pencil,
			routes: [
				{ 
					name: 'Edit Anime', 
					href: '/admin/edit/anime', 
					description: 'Browse and edit existing anime',
					icon: Film
				},
				{ 
					name: 'Edit Schedule', 
					href: '/admin/edit/schedule', 
					description: 'Browse and edit schedules',
					icon: Calendar
				},
				{ 
					name: 'Schedule Slots', 
					href: '/admin/schedule/slots', 
					description: 'Manage schedule slot templates',
					icon: Clock
				}
			]
		}
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
	<div class="grid gap-6 md:grid-cols-2">
		{#each adminRoutes as section}
			<div class="card bg-base-200 shadow-xl">
				<div class="card-body">
					<h2 class="card-title mb-4">
            <section.icon class="h-5 w-5" />
						{section.category}
					</h2>
					<div class="flex flex-col gap-3">
						{#each section.routes as route}
							<a href={route.href} class="card bg-base-300 hover:bg-base-100 transition-colors">
								<div class="card-body p-4">
									<div class="flex items-start gap-3">
										<div class="mt-1">
											<route.icon class="h-5 w-5" />
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
