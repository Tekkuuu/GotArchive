<script lang="ts">
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { LoginFormSchema, RegisterFormSchema } from '$lib/schemas/auth';
	import type { SuperValidated, Infer } from 'sveltekit-superforms';
	import { notification } from '$lib/components/ui/toaster';
	import { signIn } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { logError } from '$lib/client/logger';
	import { KeyRound, LogIn, Mail, UserPlus } from 'lucide-svelte';

	interface Props {
		data: {
			loginForm: SuperValidated<Infer<typeof LoginFormSchema>>;
			registerForm: SuperValidated<Infer<typeof RegisterFormSchema>>;
		};
	}

	let { data }: Props = $props();

	let isSignUp = $state(false);
	let loginLoading = $state(false);

	// svelte-ignore state_referenced_locally
	const { form: loginForm, errors: loginErrors } = superForm(data.loginForm, {
		validators: zod4Client(LoginFormSchema),
		validationMethod: 'onsubmit'
	});

	// svelte-ignore state_referenced_locally
	const {
		form: registerForm,
		enhance: registerEnhance,
		errors: registerErrors,
		submitting: registerSubmitting
	} = superForm(data.registerForm, {
		dataType: 'json',
		validators: zod4Client(RegisterFormSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				notification.success('Account created! You can now sign in.');
				isSignUp = false;
			} else if (result.type === 'failure' || result.type === 'error') {
				notification.error('Registration failed. Check the form for errors.');
			}
		}
	});

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();

		// Run client-side validation first
		const parsed = LoginFormSchema.safeParse($loginForm);
		if (!parsed.success) {
			// superForm validators will display field errors automatically on submit
			return;
		}

		loginLoading = true;
		try {
			const result = await signIn.email({
				email: $loginForm.email,
				password: $loginForm.password
			});

			if (result.error) {
				notification.error(result.error.message || 'Invalid email or password.');
			} else {
				notification.success('Signed in successfully');
				goto('/');
			}
		} catch (error) {
			notification.error('An unexpected error occurred.');
			logError('Sign-in failed unexpectedly', { error: String(error) });
		} finally {
			loginLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Auth | G.O.T Archive</title>
	<meta
		name="description"
		content="Login/Register to G.O.T Archive"
	/>
</svelte:head>

<div class="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body gap-0">
			<h2 class="card-title mb-1 text-2xl font-bold">
				{isSignUp ? 'Create Account' : 'Welcome Back'}
			</h2>
			<p class="mb-5 text-sm opacity-60">
				{isSignUp ? 'A registration code is required to create an account.' : 'Sign in to your account.'}
			</p>

		{#if !isSignUp}
			<!-- Sign-in form -->
			<form onsubmit={handleLogin} class="space-y-4">
				<fieldset class="fieldset bg-base-200 rounded-box p-4">
					<legend class="fieldset-legend">
						<LogIn class="size-4" />
						Credentials
					</legend>

					<div class="space-y-3">
						<div>
							<label class="input w-full">
								<Mail class="size-4 opacity-50" />
								<span class="label">Email</span>
								<input
									type="email"
									bind:value={$loginForm.email}
									disabled={loginLoading}
								/>
							</label>
							{#if $loginErrors.email}
								<p class="mt-1 text-xs text-error">{$loginErrors.email}</p>
							{/if}
						</div>

						<div>
							<label class="input w-full">
								<KeyRound class="size-4 opacity-50" />
								<span class="label">Password</span>
								<input
									type="password"
									bind:value={$loginForm.password}
									disabled={loginLoading}
								/>
							</label>
							{#if $loginErrors.password}
								<p class="mt-1 text-xs text-error">{$loginErrors.password}</p>
							{/if}
						</div>
					</div>
				</fieldset>

				<div class="flex items-center justify-between gap-3">
					<button
						type="button"
						class="btn btn-ghost btn-sm"
						onclick={() => (isSignUp = true)}
						disabled={loginLoading}
					>
						Need an account?
					</button>
					<button type="submit" class="btn btn-primary" disabled={loginLoading}>
						{#if loginLoading}
							<span class="loading loading-spinner loading-sm"></span>
							Signing in...
						{:else}
							<LogIn class="size-4" />
							Sign In
						{/if}
					</button>
				</div>
			</form>
			{:else}
				<!-- Register form -->
				<form method="POST" action="?/register" use:registerEnhance class="space-y-4">
					<fieldset class="fieldset bg-base-200 rounded-box p-4">
						<legend class="fieldset-legend">
							<UserPlus class="size-4" />
							Account Details
						</legend>

						<div class="space-y-3">
							<div>
								<label class="input w-full">
									<span class="label">Name</span>
									<input
										type="text"
										bind:value={$registerForm.name}
									/>
								</label>
								{#if $registerErrors.name}
									<p class="mt-1 text-xs text-error">{$registerErrors.name}</p>
								{/if}
							</div>

							<div>
								<label class="input w-full">
									<Mail class="size-4 opacity-50" />
									<span class="label">Email</span>
									<input
										type="email"
										bind:value={$registerForm.email}
									/>
								</label>
								{#if $registerErrors.email}
									<p class="mt-1 text-xs text-error">{$registerErrors.email}</p>
								{/if}
							</div>

							<div>
								<label class="input w-full">
									<KeyRound class="size-4 opacity-50" />
									<span class="label">Password</span>
									<input
										type="password"
										bind:value={$registerForm.password}
									/>
								</label>
								{#if $registerErrors.password}
									<p class="mt-1 text-xs text-error">{$registerErrors.password}</p>
								{/if}
							</div>
						</div>
					</fieldset>

					<fieldset class="fieldset bg-base-200 rounded-box p-4">
						<legend class="fieldset-legend">
							<KeyRound class="size-4" />
							Access
						</legend>

						<div>
							<label class="input w-full">
								<span class="label">Registration Code</span>
								<input
									type="password"
									bind:value={$registerForm.registrationCode}
								/>
							</label>
							{#if $registerErrors.registrationCode}
								<p class="mt-1 text-xs text-error">{$registerErrors.registrationCode}</p>
							{:else}
								<p class="label">
									<span class="label-text-alt">Contact an admin if you don't have a code.</span>
								</p>
							{/if}
						</div>
					</fieldset>

					<div class="flex items-center justify-between gap-3">
						<button
							type="button"
							class="btn btn-ghost btn-sm"
							onclick={() => (isSignUp = false)}
						>
							Back to sign in
						</button>
						<button type="submit" class="btn btn-success">
              <UserPlus class="size-4" />
              Create Account
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
