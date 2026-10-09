import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getRequestEvent } from '$app/server';
import { dev } from '$app/environment';
import { error } from '@sveltejs/kit';
import { db } from './db';
import * as schema from './db/schema';
import { env } from '$env/dynamic/private';
import { logger } from './logger';

const authSecret = env.BETTER_AUTH_SECRET;
if (!authSecret) {
	throw new Error('BETTER_AUTH_SECRET is not set');
}

// Prod requires explicit origin; dev falls back to localhost.
const authBaseUrl = env.BETTER_AUTH_URL;
if (!dev && !authBaseUrl) {
	throw new Error('BETTER_AUTH_URL is not set');
}
const resolvedBaseUrl = authBaseUrl || 'http://localhost:5173';

const discordClientId = env.DISCORD_CLIENT_ID;
const discordClientSecret = env.DISCORD_CLIENT_SECRET;

/** Discord OAuth is optional; linking is hidden when its credentials are unset. */
export const discordConfigured = Boolean(discordClientId && discordClientSecret);

export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: schema.bauthUser,
			session: schema.bauthSession,
			account: schema.bauthAccount,
			verification: schema.bauthVerification
		}
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false
	},
	socialProviders: discordConfigured
		? {
				discord: {
					clientId: discordClientId as string,
					clientSecret: discordClientSecret as string,
					// Accounts are only created through the moderated registration
					// flow; Discord is for linking an existing account, not sign-up.
					disableSignUp: true
				}
			}
		: {},
	account: {
		accountLinking: {
			enabled: true,
			trustedProviders: ['discord'],
			// /account explicit linking is the only supported path; never
			// auto-link an OAuth identity onto an existing local account.
			disableImplicitLinking: true,
			// Discord emails frequently differ from the site login email.
			allowDifferentEmails: true
		}
	},
	user: {
		additionalFields: {
			role: {
				type: 'string',
				enum: ['user', 'moderator', 'admin']
			}
		}
	},
	secret: authSecret,
	baseURL: resolvedBaseUrl,
	basePath: '/api/auth',
	trustedOrigins: [resolvedBaseUrl],
	advanced: {
		cookies: {
			sessionToken: {
				name: 'better-auth.session_token',
				options: {
					httpOnly: true,
					sameSite: 'lax',
					path: '/',
					secure: !dev
				}
			}
		}
	}
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;

const STAFF_ROLES = ['admin', 'moderator'] as const;

/** Asserts staff session. @returns Session. */
export async function requireStaff() {
	const { request } = getRequestEvent();
	const user = (await auth.api.getSession({ headers: request.headers }))?.user;

	if (!user || !STAFF_ROLES.includes(user.role as (typeof STAFF_ROLES)[number])) {
		logger.warn('Unauthorized access attempt to remote function', {
			userId: user?.id ?? null,
			role: user?.role ?? null
		});
		error(403, 'Forbidden');
	}

	return user;
}
