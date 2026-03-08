import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
	baseURL: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173',
	basePath: '/api/auth',
	fetchOptions: {
		credentials: 'include'
	}
});

export const { signIn, signUp, signOut } = authClient;

export const session = authClient.useSession();
