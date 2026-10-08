<script lang="ts">
	import { notification } from '$lib/components/ui/toaster';
	import { signIn } from '$lib/auth';
	import { goto } from '$app/navigation';
	import { register } from '$lib/remote/auth.remote';
	import { LoginFormSchema } from '$lib/schemas/auth';
	import { KeyRound, LogIn, Mail, UserPlus } from 'lucide-svelte';

	let isSignUp = $state(false);
	let loginLoading = $state(false);
	let loginEmail = $state('');
	let loginPassword = $state('');
	let loginErrors = $state<{ email?: string; password?: string }>({});

	async function handleLogin(e: SubmitEvent) {
		e.preventDefault();

		const parsed = LoginFormSchema.safeParse({ email: loginEmail, password: loginPassword });
		if (!parsed.success) {
			const errors: { email?: string; password?: string } = {};
			for (const issue of parsed.error.issues) {
				const field = issue.path[0];
				if (field === 'email' || field === 'password') errors[field] = issue.message;
			}
			loginErrors = errors;
			return;
		}
		loginErrors = {};

		loginLoading = true;
		try {
			const result = await signIn.email({ email: loginEmail, password: loginPassword });

			if (result.error) {
				notification.error(result.error.message || 'Invalid email or password.');
			} else {
				notification.success('Signed in successfully');
				goto('/');
			}
		} catch (error) {
			notification.error('An unexpected error occurred.');
			console.error('Sign-in failed unexpectedly', { error: String(error) });
		} finally {
			loginLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Auth | G.O.T Archive</title>
	<meta name="description" content="Login/Register to G.O.T Archive" />
</svelte:head>

<div class="container mx-auto flex min-h-[80vh] items-center justify-center px-4">
	<div class="card bg-base-200 w-full max-w-md shadow-xl">
		<div class="card-body gap-0">
			<h2 class="card-title mb-2 text-2xl font-bold">
				{isSignUp ? 'Create Account' : 'Welcome Back'}
			</h2>
			<p class="mb-5 text-sm opacity-60">
				{isSignUp
					? 'A registration code is required to create an account.'
					: 'Sign in to your account.'}
			</p>

			{#if !isSignUp}
				<!-- Sign-in form -->
				<form onsubmit={handleLogin} class="space-y-4">
					<fieldset class="fieldset bg-base-300 rounded-box p-4">
						<legend class="fieldset-legend">
							<LogIn class="" />
							Credentials
						</legend>

						<div class="space-y-4">
							<div>
								<label class="input w-full">
									<Mail class=" opacity-50" />
									<span class="label">Email</span>
									<input
										type="email"
										bind:value={loginEmail}
										disabled={loginLoading}
										aria-invalid={!!loginErrors.email}
										aria-describedby={loginErrors.email ? 'login-email-error' : undefined}
									/>
								</label>
								{#if loginErrors.email}
									<p id="login-email-error" class="text-error mt-2 text-xs" role="alert">
										{loginErrors.email}
									</p>
								{/if}
							</div>

							<div>
								<label class="input w-full">
									<KeyRound class=" opacity-50" />
									<span class="label">Password</span>
									<input
										type="password"
										bind:value={loginPassword}
										disabled={loginLoading}
										aria-invalid={!!loginErrors.password}
										aria-describedby={loginErrors.password ? 'login-password-error' : undefined}
									/>
								</label>
								{#if loginErrors.password}
									<p id="login-password-error" class="text-error mt-2 text-xs" role="alert">
										{loginErrors.password}
									</p>
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
								<LogIn class="" />
								Sign In
							{/if}
						</button>
					</div>
				</form>
			{:else}
				<!-- Register form -->
				<form
					{...register.enhance(async (form) => {
						const success = await form.submit();
						if (success && form.result?.success) {
							notification.success('Account created! You can now sign in.');
							isSignUp = false;
						} else if (!success) {
							notification.error('Registration failed. Check the form for errors.');
						}
					})}
					class="space-y-4"
				>
					<fieldset class="fieldset bg-base-300 rounded-box p-4">
						<legend class="fieldset-legend">
							<UserPlus class="" />
							Account Details
						</legend>

						<div class="space-y-4">
							<div>
								<label class="input w-full">
									<span class="label">Name</span>
									<input
										{...register.fields.name.as('text')}
										aria-invalid={!!register.fields.name.issues()?.[0]}
										aria-describedby={register.fields.name.issues()?.[0]
											? 'register-name-error'
											: undefined}
									/>
								</label>
								{#if register.fields.name.issues()?.[0]}
									<p id="register-name-error" class="text-error mt-2 text-xs" role="alert">
										{register.fields.name.issues()?.[0]?.message}
									</p>
								{/if}
							</div>

							<div>
								<label class="input w-full">
									<Mail class=" opacity-50" />
									<span class="label">Email</span>
									<input
										{...register.fields.email.as('email')}
										aria-invalid={!!register.fields.email.issues()?.[0]}
										aria-describedby={register.fields.email.issues()?.[0]
											? 'register-email-error'
											: undefined}
									/>
								</label>
								{#if register.fields.email.issues()?.[0]}
									<p id="register-email-error" class="text-error mt-2 text-xs" role="alert">
										{register.fields.email.issues()?.[0]?.message}
									</p>
								{/if}
							</div>

							<div>
								<label class="input w-full">
									<KeyRound class=" opacity-50" />
									<span class="label">Password</span>
									<input
										{...register.fields.password.as('password')}
										aria-invalid={!!register.fields.password.issues()?.[0]}
										aria-describedby={register.fields.password.issues()?.[0]
											? 'register-password-error'
											: undefined}
									/>
								</label>
								{#if register.fields.password.issues()?.[0]}
									<p id="register-password-error" class="text-error mt-2 text-xs" role="alert">
										{register.fields.password.issues()?.[0]?.message}
									</p>
								{/if}
							</div>
						</div>
					</fieldset>

					<fieldset class="fieldset bg-base-300 rounded-box p-4">
						<legend class="fieldset-legend">
							<KeyRound class="" />
							Access
						</legend>

						<div>
							<label class="input w-full">
								<span class="label">Registration Code</span>
								<input
									{...register.fields.registrationCode.as('password')}
									aria-invalid={!!register.fields.registrationCode.issues()?.[0]}
									aria-describedby={register.fields.registrationCode.issues()?.[0]
										? 'register-code-error'
										: undefined}
								/>
							</label>
							{#if register.fields.registrationCode.issues()?.[0]}
								<p id="register-code-error" class="text-error mt-2 text-xs" role="alert">
									{register.fields.registrationCode.issues()?.[0]?.message}
								</p>
							{:else}
								<p class="label">
									<span class="label-text-alt">Contact an admin if you don't have a code.</span>
								</p>
							{/if}
						</div>
					</fieldset>

					<div class="flex items-center justify-between gap-3">
						<button type="button" class="btn btn-ghost btn-sm" onclick={() => (isSignUp = false)}>
							Back to sign in
						</button>
						<button type="submit" class="btn btn-success" disabled={register.pending > 0}>
							{#if register.pending > 0}
								<span class="loading loading-spinner loading-sm"></span>
								Creating...
							{:else}
								<UserPlus class="" />
								Create Account
							{/if}
						</button>
					</div>
				</form>
			{/if}
		</div>
	</div>
</div>
