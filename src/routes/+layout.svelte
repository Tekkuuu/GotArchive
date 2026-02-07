<script lang="ts">
	import type { LayoutProps } from './$types';
	import '../app.css';
	import { page } from '$app/state';
	import {
		Home,
		Database,
		TvMinimalPlay,
		Calendar,
		Sun,
		Moon,
		Globe,
		Info,
		Menu,
    User,
    LogOut,
    ShieldUser,
    type Icon,
	} from 'lucide-svelte';
	import { Toaster } from '$lib/components/ui/toaster';
	import { getDarkModeStore } from '$lib/stores';
  import { session, signOut } from '$lib/auth';

	let { children, data }: LayoutProps = $props();
	let darkMode = getDarkModeStore();
  let expand = $state(false);

	// Function to toggle theme
	function toggleTheme() {
		const newValue = !darkMode.value;
		darkMode.set(newValue);
		// Update data-theme attribute on html element
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', newValue ? 'gotdark' : 'gotlight');
		}
	}

  function handleLogut(e: Event) {
    e.preventDefault();
    signOut();
  }

	// Initialize theme on mount
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.setAttribute('data-theme', darkMode.value ? 'gotdark' : 'gotlight');
		}
	});
</script>

{#snippet navTab(route: typeof page.route.id, icon: typeof Icon, label: string, expand: boolean = false)}
  {@const RouteIcon = icon}
  <a
    href={route}
    class={[
      !expand && 'tooltip tooltip-bottom',
      page.route.id === route && 'btn-secondary',
      "join-item btn flex grow"
    ]}
    data-tip={label}
  >
    <RouteIcon />
    {#if expand}
      {label}
    {/if}
  </a>
{/snippet}


{#snippet navBtn(action: (e: Event) => void, icon: typeof Icon, label: string, expand: boolean = false)}
  {@const RouteIcon = icon}
  <button
    type="button"
    class={[
      !expand && 'tooltip tooltip-bottom',
      "join-item btn flex grow"
    ]}
    data-tip={label}
    onclick={action}
  >
    <RouteIcon />
    {#if expand}
      {label}
    {/if}
  </button>
{/snippet}

<div class="flex min-h-screen flex-col">
  <nav class="flex gap-4 h-16 bg-base-300 fixed w-full z-50">
    <div class="flex justify-center items-center p-4">
      <a href="/" class="font-bold text-2xl hover:text-primary transition-all duration-150">GotArchive</a>
    </div>
    <div class="flex grow justify-center items-center p-4">
      <div class="join *:min-w-20">
        {@render navTab('/', Home, 'Dashboard', expand)}
        {@render navTab('/gotgames/schedule', Calendar, 'Schedule', expand)}
        {@render navTab('/gotgames/anime/list', TvMinimalPlay, 'Anime reactions', expand)}
        {@render navTab('/about', Info, 'About', expand)}
      </div>
    </div>
    <div class="flex justify-center items-center p-4">
      {#if $session.data}
        <div class="join">
          {@render navTab('/admin', ShieldUser, 'Admin', expand)}
          {@render navBtn(handleLogut, LogOut, "Logout", expand)}
        </div>
      {/if}
    </div>
  </nav>
	<Toaster />
	<main class="mx-2 mb-2 mt-16 flex grow flex-col">
		{@render children()}
	</main>
	<footer class="bg-base-300 flex w-full gap-2 p-2 shadow-sm border-t border-base-content/10">
		<nav class="flex gap-2 items-center">
			<button
				class="swap swap-rotate btn btn-secondary btn-outline"
				onclick={toggleTheme}
				aria-label="Toggle theme"
			>
				{#if darkMode.value}
					<Moon class="h-5 w-5" />
				{:else}
					<Sun class="h-5 w-5" />
				{/if}
			</button>
			<a href="/privacy" class="btn btn-secondary btn-outline">Privacy</a>
			<a href="/tos" class="btn btn-secondary btn-outline">Terms</a>
		</nav>
	</footer>
</div>
