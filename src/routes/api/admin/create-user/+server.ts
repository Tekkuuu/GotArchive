import { authClient } from '$lib/auth/auth';
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { neon } from '@neondatabase/serverless';

/**
 * Temporary endpoint to create admin users
 * IMPORTANT: Remove or secure this endpoint after creating initial admin accounts!
 *
 * Usage:
 * POST /api/admin/create-user
 * Body: {
 *   "email": "admin@example.com",
 *   "password": "secure-password",
 *   "name": "Admin User",
 *   "role": "admin" | "moderator",
 *   "secret": "your-setup-secret-from-env"
 * }
 */
export const POST: RequestHandler = async ({ request }) => {
	// Add a secret key check to prevent unauthorized use
	const SETUP_SECRET = env.SETUP_SECRET;

	if (!SETUP_SECRET) {
		throw error(500, 'SETUP_SECRET not configured. Add SETUP_SECRET to your .env file.');
	}

	const { email, password, name, role, secret } = await request.json();

	// Validate secret
	if (secret !== SETUP_SECRET) {
		throw error(401, 'Unauthorized: Invalid setup secret');
	}

	// Validate inputs
	if (!email || !password || !name || !role) {
		throw error(400, 'Missing required fields: email, password, name, role');
	}

	if (role !== 'admin' && role !== 'moderator') {
		throw error(400, 'Invalid role. Must be "admin" or "moderator"');
	}

	try {
		// Create the user via NeonDB Auth
		const result = await authClient.signUp.email({
			email,
			password,
			name,
			callbackURL: '/admin'
		});

		if (result.error) {
			throw error(400, result.error.message || 'Failed to create user');
		}

		// The user is now created, but we need to add the role to user_metadata
		// Since NeonDB Auth uses better-auth under the hood, we need to update the user table directly

		// Wait a bit for the user to be created
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Update user_metadata with role using raw SQL
		// Note: The user table is managed by NeonDB Auth, not in our schema
		if (!env.VITE_DATABASE_URL) throw new Error('VITE_DATABASE_URL is not set');
		const sql = neon(env.VITE_DATABASE_URL);

		await sql`
			UPDATE "user" 
			SET user_metadata = jsonb_set(
				COALESCE(user_metadata, '{}'::jsonb),
				'{role}',
				${`"${role}"`}
			)
			WHERE email = ${email}
		`;

		return json({
			success: true,
			message: `${role.charAt(0).toUpperCase() + role.slice(1)} user created successfully`,
			user: {
				email,
				name,
				role
			}
		});
	} catch (e: any) {
		console.error('Failed to create admin user:', e);
		throw error(500, e.message || 'Failed to create admin user');
	}
};
