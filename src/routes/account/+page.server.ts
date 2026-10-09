import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { auth, discordConfigured } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals, request }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	let accounts: { id: string; providerId: string; accountId: string; createdAt: Date }[] = [];
	try {
		const listed = await auth.api.listUserAccounts({ headers: request.headers });
		accounts = listed.map((account) => ({
			id: account.id,
			providerId: account.providerId,
			accountId: account.accountId,
			createdAt: account.createdAt
		}));
	} catch {
		throw redirect(303, '/login');
	}

	return {
		discordConfigured,
		// Expose only what the UI needs; never leak tokens or provider secrets.
		accounts
	};
};
