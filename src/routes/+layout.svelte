<script lang="ts">
	import type { LayoutProps } from './$types';
	import '../app.css';
	import { page } from '$app/state';
	import { Home, Database, TvMinimalPlay, Calendar, Sun, Moon, Globe } from 'lucide-svelte';
	import { FeedbackModal, CookieConsent } from '$lib/components/ui/';
	import { Toaster } from '$lib/components/ui/toaster';
	import { invalidate } from '$app/navigation';
	import { getDarkModeStore, getAnonymousUUIDStore, getCookieConsentStore } from '$lib/stores';
	import { onMount } from 'svelte';

	let { children, data }: LayoutProps = $props();
	let { session, supabase } = $derived(data);

	let feedbackOpen = $state(false);
	let darkMode = getDarkModeStore();

	$effect(() => {
		if (supabase) {
			const { data: authListener } = supabase.auth.onAuthStateChange((_, newSession) => {
				if (newSession?.expires_at !== session?.expires_at) {
					invalidate('supabase:auth');
				}
			});

			return () => {
				authListener?.subscription.unsubscribe();
			};
		}
	});

	onMount(() => {
		getAnonymousUUIDStore();
	});

	$inspect(page);
</script>

<div class="flex min-h-screen flex-col">
	<CookieConsent />
	<div class="navbar bg-base-300 fixed z-50 shadow-sm">
		<div class="navbar-start">
			<div class="dropdown">
				<div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 6h16M4 12h8m-8 6h16"
						/>
					</svg>
				</div>
				<ul class="menu menu-sm dropdown-content bg-base-100 rounded-box z-50 mt-4 p-2 shadow">
					<li>
						<a href="/">Dashboard</a>
					</li>
					<li>
						<a href="/gotgames/schedule"> Schedule </a>
					</li>
					<li>
						<details>
							<summary>Reactions</summary>
							<ul class="**:text-nowrap">
								<li>
									<a href="/gotgames/anime/list"> Anime </a>
								</li>
							</ul>
						</details>
					</li>
					<li>
						<details>
							<summary>Socials</summary>
							<ul class="**:text-nowrap">
								<li>
									<a target="_blank" href="https://www.youtube.com/c/GOTGames">
										G.O.T Games Youtube
									</a>
								</li>
								<li>
									<a target="_blank" href="https://www.youtube.com/@GOTExtraChannel">
										G.O.T Extra Youtube
									</a>
								</li>
								<li>
									<a target="_blank" href="https://www.youtube.com/@GOT_Clips">
										G.O.T Clips Youtube
									</a>
								</li>
								<li>
									<a target="_blank" href="https://www.twitch.tv/gotgames_tb">Twitch</a>
								</li>
								<li>
									<a target="_blank" href="https://x.com/GOTGAMES_TB">X (Twitter)</a>
								</li>
								<li>
									<a target="_blank" href="https://discord.gg/MXTebs9yb2">Discord</a>
								</li>
							</ul>
						</details>
					</li>
					{#if session?.user}
						<li>
							<details>
								<summary> Admin </summary>
								<ul class="**:text-nowrap">
									<li>
										<a href="/admin/feedback">Feedback</a>
									</li>
									<li>
										<details>
											<summary>New</summary>
											<ul>
												<li>
													<a href="/admin/new/anime">Anime</a>
												</li>
												<li>
													<a href="/admin/new/season">Season</a>
												</li>
												<li>
													<a href="/admin/new/schedule">Schedule</a>
												</li>
											</ul>
										</details>
									</li>
									<li>
										<details>
											<summary>Edit</summary>
											<ul>
												<li>
													<a href="/admin/edit/anime">Anime</a>
												</li>
												<li>
													<a href="/admin/edit/schedule">Schedule</a>
												</li>
											</ul>
										</details>
									</li>
								</ul>
							</details>
						</li>
					{/if}
				</ul>
			</div>
			<a href="/" class="btn btn-ghost text-xl">GotArchive</a>
		</div>
		<div class="navbar-center hidden lg:flex">
			<ul class="menu menu-horizontal gap-2 px-1">
				<li>
					<a href="/" class="btn {page.route.id === '/' && 'btn-secondary'}">
						<Home />
						Dashboard
					</a>
				</li>
				<li>
					<a
						href="/gotgames/schedule"
						class="btn {page.route.id === '/gotgames/schedule' && 'btn-secondary'}"
					>
						<Calendar />
						Schedule
					</a>
				</li>
				<li>
					<details>
						<summary class="btn {page.route.id === '/gotgames/anime/list' && 'btn-secondary'}">
							<TvMinimalPlay />
							Reactions
						</summary>
						<ul class="bg-base-300 left-1/2 -translate-x-1/2 translate-y-2 p-2 **:text-nowrap">
							<li>
								<a
									href="/gotgames/anime/list"
									class="btn {page.route.id === '/gotgames/anime/list' && 'btn-secondary'}"
								>
									Anime
								</a>
							</li>
						</ul>
					</details>
				</li>
				<li>
					<details>
						<summary class="btn">
							<Globe />
							Socials
						</summary>
						<ul class="bg-base-300 left-1/2 -translate-x-1/2 translate-y-2 p-2 **:text-nowrap">
							<li>
								<a target="_blank" href="https://www.youtube.com/c/GOTGames">
									G.O.T Games Youtube
								</a>
							</li>
							<li>
								<a target="_blank" href="https://www.youtube.com/@GOTExtraChannel">
									G.O.T Extra Youtube
								</a>
							</li>
							<li>
								<a target="_blank" href="https://www.youtube.com/@GOT_Clips">
									G.O.T Clips Youtube
								</a>
							</li>
							<li>
								<a target="_blank" href="https://www.twitch.tv/gotgames_tb">Twitch</a>
							</li>
							<li>
								<a target="_blank" href="https://x.com/GOTGAMES_TB">X (Twitter)</a>
							</li>
							<li>
								<a target="_blank" href="https://discord.gg/MXTebs9yb2">Discord</a>
							</li>
						</ul>
					</details>
				</li>
				{#if session?.user}
					<li>
						<details>
							<summary class="btn">
								<Database />
								Admin
							</summary>
							<ul class="bg-base-300 left-1/2 -translate-x-1/2 translate-y-2 p-2 **:text-nowrap">
								<li>
									<a href="/admin/feedback">Feedback</a>
								</li>
								<li>
									<details>
										<summary>New</summary>
										<ul>
											<li>
												<a href="/admin/new/anime">Anime</a>
											</li>
											<li>
												<a href="/admin/new/season">Season</a>
											</li>
											<li>
												<a href="/admin/new/schedule">Schedule</a>
											</li>
										</ul>
									</details>
								</li>
								<li>
									<details>
										<summary>Edit</summary>
										<ul>
											<li>
												<a href="/admin/edit/anime">Anime</a>
											</li>
											<li>
												<a href="/admin/edit/schedule">Schedule</a>
											</li>
										</ul>
									</details>
								</li>
							</ul>
						</details>
					</li>
				{/if}
			</ul>
		</div>
		<div class="navbar-end">
			{#if session?.user}
				<button
					class="btn"
					type="button"
					onclick={() => {
						supabase.auth.signOut();
					}}
				>
					Logout
				</button>
			{/if}
		</div>
	</div>
	<Toaster />
	<main class="mx-2 mt-20 mb-2 flex grow flex-col">
		{@render children()}
	</main>
	<FeedbackModal formData={data.feedbackForm} bind:open={feedbackOpen} />
	<footer class="bg-base-300 flex w-full gap-2 p-2">
		<nav class="flex gap-2">
			<label class="swap swap-rotate btn btn-secondary btn-outline">
				<input
					type="checkbox"
					class="theme-controller"
					value="gotdark"
					bind:checked={() => darkMode.value, (v) => darkMode.update(() => v)}
				/>
				<Sun class="swap-off" />
				<Moon class="swap-on" />
			</label>
			<button class="btn btn-secondary btn-outline" onclick={() => (feedbackOpen = !feedbackOpen)}>
				Feedback
			</button>
			<a href="/privacy" class="btn btn-secondary btn-outline">Privacy</a>
			<a href="/tos" class="btn btn-secondary btn-outline">Terms</a>
		</nav>
	</footer>
</div>
