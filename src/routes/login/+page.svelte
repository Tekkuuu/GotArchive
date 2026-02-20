<script lang="ts">
	import { signIn, signUp } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { notification } from '$lib/components/ui/toaster';
	import { logError } from '$lib/client/logger';
	import { LogIn, UserPlus } from 'lucide-svelte';

	let email = $state('');
	let password = $state('');
	let name = $state('');
	let isSignUp = $state(false);
	let loading = $state(false);

	async function handleSignIn() {
		loading = true;
		try {
			const result = await signIn.email({
				email,
				password
			});

			if (result.error) {
				notification.error(result.error.message || 'Failed to sign in');
			} else {
				notification.success('Successfully signed in!');
				goto('/');
			}
		} catch (error) {
			notification.error('An unexpected error occurred');
			logError('Sign-in failed unexpectedly', { error: String(error) });
		} finally {
			loading = false;
		}
	}

	async function handleSignUp() {
		loading = true;
		try {
			const result = await signUp.email({
				email,
				password,
				name
			});

			if (result.error) {
				notification.error(result.error.message || 'Failed to sign up');
			} else {
				notification.success('Successfully signed up! Please sign in.');
				isSignUp = false;
			}
		} catch (error) {
			notification.error('An unexpected error occurred');
			logError('Sign-up failed unexpectedly', { error: String(error) });
		} finally {
			loading = false;
		}
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (isSignUp) {
			handleSignUp();
		} else {
			handleSignIn();
		}
	}
</script>

<svelte:head>
	<title>{isSignUp ? 'Sign Up' : 'Login'} | G.O.T Archive</title>
	<meta
		name="description"
		content="{isSignUp ? 'Create an account' : 'Sign in'} to G.O.T Archive"
	/>
</svelte:head>

<div class="container mx-auto flex min-h-[80vh] items-center justify-center">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title text-center text-3xl font-bold">
				{isSignUp ? 'Create Account' : 'Welcome Back'}
			</h2>
			<p class="text-center text-sm opacity-70">
				{isSignUp ? 'Sign up to get started' : 'Sign in to your account'}
			</p>

			<form onsubmit={handleSubmit} class="mt-4 flex flex-col gap-4">
				{#if isSignUp}
					<div class="form-control">
						<label class="label" for="name">
							<span class="label-text">Name</span>
						</label>
						<input
							id="name"
							type="text"
							placeholder="Your name"
							class="input input-bordered"
							bind:value={name}
							required
							disabled={loading}
						/>
					</div>
				{/if}

				<div class="form-control">
					<label class="label" for="email">
						<span class="label-text">Email</span>
					</label>
					<input
						id="email"
						type="email"
						placeholder="your@email.com"
						class="input input-bordered"
						bind:value={email}
						required
						disabled={loading}
					/>
				</div>

				<div class="form-control">
					<label class="label" for="password">
						<span class="label-text">Password</span>
					</label>
					<input
						id="password"
						type="password"
						placeholder="••••••••"
						class="input input-bordered"
						bind:value={password}
						required
						disabled={loading}
						minlength="8"
					/>
					{#if isSignUp}
						<label class="label">
							<span class="label-text-alt">At least 8 characters</span>
						</label>
					{/if}
				</div>

				<div class="form-control mt-4">
					<button type="submit" class="btn btn-primary" disabled={loading}>
						{#if loading}
							<span class="loading loading-spinner"></span>
						{:else if isSignUp}
							<UserPlus size={20} />
						{:else}
							<LogIn size={20} />
						{/if}
						<span class="font-bold">{isSignUp ? 'Sign Up' : 'Sign In'}</span>
					</button>
				</div>
			</form>

			<div class="divider">OR</div>

			<button
				class="btn btn-ghost btn-sm"
				onclick={() => {
					isSignUp = !isSignUp;
				}}
				disabled={loading}
			>
				{isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
			</button>
		</div>
	</div>
</div>
