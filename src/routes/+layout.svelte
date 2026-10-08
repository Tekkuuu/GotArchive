<script lang="ts">
	import type { LayoutProps } from './$types';
	import '../app.css';
	import { page } from '$app/state';
	import {
		Home,
		TvMinimalPlay,
		Calendar,
		Palette,
		Info,
		LogOut,
		ShieldUser,
		FileText,
		Lock,
		Bell
	} from 'lucide-svelte';
	import { NotificationCenter, NotificationPopup, notification } from '$lib/components/ui/toaster';
	import MobileDock from '$lib/components/ui/navbar/MobileDock.svelte';
	import MobileMenu from '$lib/components/ui/navbar/MobileMenu.svelte';
	import TimezoneSelect from '$lib/components/schedule/TimezoneSelect.svelte';
	import { SocialsCorner } from '$lib/components/ui/socials';
	import { getThemeStore, AVAILABLE_THEMES, type Theme } from '$lib/stores';
	import { session, signOut } from '$lib/auth';

	let { children, data }: LayoutProps = $props();
	let theme = getThemeStore();

	const tzParam = $derived(page.url.searchParams.get('tz'));

	function changeTheme(newTheme: Theme) {
		theme.set(newTheme);
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', newTheme);
		}
	}

	function handleLogout(e?: Event) {
		e?.preventDefault();
		signOut();
	}

	const isAdmin = $derived(
		($session.data?.user as { role?: string })?.role === 'admin' ||
			($session.data?.user as { role?: string })?.role === 'moderator'
	);

	const dockItems = $derived([
		{ route: '/', icon: Home, label: 'Home' },
		{ route: '/gotgames/schedule', icon: Calendar, label: 'Schedule' },
		{ route: '/gotgames/anime/list', icon: TvMinimalPlay, label: 'Anime' },
		{ route: '/notifications', icon: Bell, label: 'Notifications', isNotification: true },
		...(isAdmin ? [{ route: '/admin', icon: ShieldUser, label: 'Admin' }] : [])
	]);

	const menuItems = $derived([
		{ label: 'About', route: '/about', icon: Info },
		{ label: 'Privacy', route: '/privacy', icon: Lock },
		{ label: 'Terms', route: '/tos', icon: FileText },
		{ label: 'Theme', action: 'theme' as const, icon: Palette },
		...($session.data ? [{ label: 'Logout', action: 'logout' as const, icon: LogOut }] : [])
	]);

	/** Routes that render the socials corner; admin/auth screens are excluded. */
	const socialsRoutes = new Set(['/', '/about', '/privacy', '/tos']);
	const showSocials = $derived(
		page.route.id !== null &&
			(socialsRoutes.has(page.route.id) || page.route.id.startsWith('/gotgames'))
	);

	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', theme.value);
		}
	});
</script>

<div class="flex min-h-screen flex-col">
	<!-- Desktop Navbar -->
	<nav
		class="border-base-content/10 bg-base-300 fixed top-0 z-50 hidden h-16 w-full items-center border-b px-2 md:flex"
	>
		<!-- Left Section -->
		<div class="flex flex-1 items-center justify-start">
			<a href="/" class="hover:text-primary px-2 text-2xl font-bold transition-all duration-150">
				GotArchive
			</a>
		</div>

		<!-- Middle Section - Centered Navigation -->
		<div class="flex items-center justify-center">
			<div class="join">
				<a
					href="/"
					class={`btn join-item tooltip tooltip-bottom ${page.route.id === '/' ? 'btn-secondary' : ''}`}
					data-tip="Dashboard"
				>
					<Home class="h-5 w-5" />
				</a>
				<a
					href="/gotgames/schedule"
					class={`btn join-item tooltip tooltip-bottom ${page.route.id === '/gotgames/schedule' ? 'btn-secondary' : ''}`}
					data-tip="Schedule"
				>
					<Calendar class="h-5 w-5" />
				</a>
				<a
					href="/gotgames/anime/list"
					class={`btn join-item tooltip tooltip-bottom ${page.route.id === '/gotgames/anime/list' ? 'btn-secondary' : ''}`}
					data-tip="Anime reactions"
				>
					<TvMinimalPlay class="h-5 w-5" />
				</a>
				<a
					href="/about"
					class={`btn join-item tooltip tooltip-bottom ${page.route.id === '/about' ? 'btn-secondary' : ''}`}
					data-tip="About"
				>
					<Info class="h-5 w-5" />
				</a>
			</div>
		</div>

		<!-- Right Section -->
		<div class="flex flex-1 items-center justify-end gap-2">
			<TimezoneSelect compact raw={tzParam} />
			<button
				class="btn btn-ghost tooltip tooltip-bottom relative"
				data-tip={`Notifications ${notification.unreadCount > 99 ? '(99+)' : notification.unreadCount > 0 ? `(${notification.unreadCount})` : ''}`}
				onclick={() => notification.toggleDrawer()}
			>
				{#if notification.unreadCount > 0}
					<span class="status status-success absolute top-1 right-1"></span>
				{/if}
				<Bell />
			</button>

			<div class="dropdown dropdown-end tooltip tooltip-bottom" data-tip="Select theme">
				<button tabindex="0" class="btn btn-ghost" aria-label="Select theme">
					<Palette class="h-5 w-5" />
				</button>
				<ul class="menu dropdown-content rounded-box bg-base-200 z-10 mt-2 w-52 p-2 shadow-xl">
					{#each AVAILABLE_THEMES as themeName}
						<li>
							<button
								class={theme.value === themeName ? 'active' : ''}
								onclick={() => changeTheme(themeName)}
							>
								{themeName}
							</button>
						</li>
					{/each}
				</ul>
			</div>

			{#if isAdmin}
				<a
					href="/admin"
					class={`btn btn-ghost tooltip tooltip-bottom ${page.route.id === '/admin' ? 'btn-secondary' : ''}`}
					data-tip="Admin"
				>
					<ShieldUser class="h-5 w-5" />
				</a>
			{/if}

			{#if $session.data}
				<button
					class="btn btn-ghost tooltip tooltip-bottom"
					data-tip="Logout"
					onclick={handleLogout}
				>
					<LogOut class="h-5 w-5" />
				</button>
			{/if}
		</div>
	</nav>

	<NotificationCenter />
	<NotificationPopup />

	<!-- Mobile Dock (bottom navigation) -->
	<MobileDock items={dockItems} />

	<!-- Mobile FAB Menu -->
	<MobileMenu items={menuItems} {changeTheme} {handleLogout} tzRaw={tzParam} />

	<!-- Main Content -->
	<main class="mx-2 mt-2 mb-16 flex grow flex-col md:mt-16 md:mb-2">
		{#if showSocials}
			<SocialsCorner platforms={data.platforms} />
		{/if}
		{@render children()}
	</main>

	<!-- Footer -->
	<footer
		class="border-base-content/10 bg-base-300 hidden w-full gap-2 border-t p-2 shadow-sm md:flex"
	>
		<nav class="flex flex-wrap items-center gap-2">
			<a href="/privacy" class="link-hover link text-sm">Privacy</a>
			<a href="/tos" class="link-hover link text-sm">Terms</a>
		</nav>
	</footer>
</div>
