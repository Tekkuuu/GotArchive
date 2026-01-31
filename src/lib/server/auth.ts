import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './db/shared/schema';
import { env } from '$env/dynamic/private';

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
		requireEmailVerification: false // Set to true if you want email verification
	},
	user: {
		additionalFields: {
			role: {
				type: 'string',
				enum: ['user', 'moderator', 'admin']
			}
		}
	},
	secret: env.BETTER_AUTH_SECRET || 'your-secret-key-change-this',
	baseURL: env.BETTER_AUTH_URL || 'http://localhost:5173',
	trustedOrigins: [env.BETTER_AUTH_URL || 'http://localhost:5173']
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
