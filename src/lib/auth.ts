import { createAuthClient } from 'better-auth/svelte';

export const authClient = createAuthClient({
	baseURL: 'http://localhost:5173' // Update this for production
});

export const { signIn, signUp, signOut } = authClient;
export const session = authClient.useSession;
