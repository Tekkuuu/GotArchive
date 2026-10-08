import { createAuthClient } from 'better-auth/svelte';
import { env as publicEnv } from '$env/dynamic/public';

const baseURL =
	publicEnv.PUBLIC_BETTER_AUTH_URL ||
	(typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173');

export const authClient = createAuthClient({
	baseURL,
	basePath: '/api/auth',
	fetchOptions: {
		credentials: 'include'
	}
});

export const { signIn, signUp, signOut } = authClient;

export const session = authClient.useSession();
