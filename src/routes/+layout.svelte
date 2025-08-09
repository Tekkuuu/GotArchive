<script lang="ts">
	import type { LayoutProps } from './$types';
	import '../app.css';
	import {
		Home,
		Database,
		TvMinimalPlay,
		KeyRound,
		Calendar,
		Globe,
		Info,
		Logs
	} from 'lucide-svelte';
	import {
		Navbar,
		NavDropdown,
		NavUl,
		NavLi,
		Footer,
		FeedbackModal,
		FeedbackModalToggle,
		DarkModeToggle,
		CookieConsent
	} from '$lib/components/ui/';
	import { Toaster } from '$lib/components/ui/toaster';
	import { invalidate } from '$app/navigation';
	import { getAnonymousUUIDStore } from '$lib/stores';

	let { children, data }: LayoutProps = $props();
	let { session, supabase } = $derived(data);
	let anonymousUUID = getAnonymousUUIDStore();
	let feedbackOpen = $state(false);

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
</script>

<div class="flex min-h-screen flex-col">
	<CookieConsent />
	<Navbar>
		<NavUl>
			<NavLi href="/"><Home />Home</NavLi>
			<NavLi href="/gotgames/schedule"><Calendar />Schedule</NavLi>
			{#if session?.user}
				<NavLi id="admin">
					<Database />Admin
					<NavDropdown trigger="#admin">
						<NavLi href="/admin/new/anime">New anime</NavLi>
						<NavLi href="/admin/new/anime/bulk">New anime bulk</NavLi>
						<NavLi href="/admin/new/season">New season</NavLi>
						<NavLi href="/admin/new/schedule">New schedule</NavLi>
						<NavLi href="/admin/edit/anime">Edit anime</NavLi>
						<NavLi href="/admin/edit/schedule">Edit schedule</NavLi>
					</NavDropdown>
				</NavLi>
			{/if}
			<NavLi href="/gotgames/anime/list"><TvMinimalPlay />Anime</NavLi>
			<NavLi id="got-socials">
				<Globe />G.O.T Socials
				<NavDropdown trigger="#got-socials">
					<NavLi target="_blank" href="https://www.youtube.com/c/GOTGames">
						G.O.T Games Youtube
					</NavLi>
					<NavLi target="_blank" href="https://www.youtube.com/@GOTExtraChannel">
						G.O.T Extra Youtube
					</NavLi>
					<NavLi target="_blank" href="https://www.youtube.com/@GOT_Clips">
						G.O.T Clips Youtube
					</NavLi>
					<NavLi target="_blank" href="https://www.twitch.tv/gotgames_tb">Twitch</NavLi>
					<NavLi target="_blank" href="https://x.com/GOTGAMES_TB">X (Twitter)</NavLi>
					<NavLi target="_blank" href="discord.gg/MXTebs9yb2">Discord</NavLi>
				</NavDropdown>
			</NavLi>
			<NavLi href="/about"><Info />About</NavLi>
			<NavLi href="/changelog"><Logs />Site news</NavLi>
			{#if session?.user}
				<NavLi
					onclick={(e: MouseEvent) => {
						e.preventDefault();
						supabase.auth.signOut();
					}}
				>
					<KeyRound />Logout
				</NavLi>
			{/if}
		</NavUl>
	</Navbar>
	<Toaster />
	<main class="mt-1 flex grow flex-col">
		{@render children()}
	</main>
	<FeedbackModal formData={data.feedbackForm} bind:open={feedbackOpen} />
	<Footer>
		<DarkModeToggle />
		<FeedbackModalToggle bind:open={feedbackOpen} />
		<a
			href="/privacy"
			class={[
				'dark:text-primary-50 text-primary-900 border-primary-900 dark:border-primary-50 border',
				'flex items-center justify-center rounded-full p-2',
				'transition-all duration-150'
			]}>Privacy policy</a
		>
		<a
			href="/tos"
			class={[
				'dark:text-primary-50 text-primary-900 border-primary-900 dark:border-primary-50 border',
				'flex items-center justify-center rounded-full p-2',
				'transition-all duration-150'
			]}
		>
			Terms of Service
		</a>
	</Footer>
</div>
