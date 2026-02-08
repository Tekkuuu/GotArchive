# Better Auth Setup Guide (Alternative to NeonDB Auth)

## Overview

This is an **alternative authentication system** using better-auth with email+password login, sessions, and user roles. This setup is self-contained and doesn't require an external NeonDB Auth backend.

**Note:** The project currently uses NeonDB Auth (see `AUTH_SETUP.md`). This guide provides an alternative if you want to switch to a fully self-hosted auth solution.

## Database Schema

The authentication tables are stored in a separate `bauth` PostgreSQL schema with the following tables:

### Tables

1. **bauth.user** - User accounts
   - `id` (text, primary key)
   - `name` (text)
   - `email` (text, unique)
   - `emailVerified` (boolean)
   - `image` (text, optional)
   - `role` (enum: 'user', 'moderator', 'admin')
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

2. **bauth.session** - User sessions
   - `id` (text, primary key)
   - `expiresAt` (timestamp)
   - `token` (text, unique)
   - `ipAddress` (text, optional)
   - `userAgent` (text, optional)
   - `userId` (text, foreign key to user)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

3. **bauth.account** - OAuth/password accounts
   - `id` (text, primary key)
   - `accountId` (text)
   - `providerId` (text)
   - `userId` (text, foreign key to user)
   - `password` (text, hashed)
   - Various OAuth token fields
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

4. **bauth.verification** - Email verification tokens
   - `id` (text, primary key)
   - `identifier` (text)
   - `value` (text)
   - `expiresAt` (timestamp)
   - `createdAt` (timestamp)
   - `updatedAt` (timestamp)

## Setup Instructions

### 1. Install Dependencies

The required packages have already been installed:

- `better-auth` - Authentication library
- `drizzle-orm@latest` - Updated ORM
- `drizzle-kit@latest` - Updated database toolkit

### 2. Configure Environment Variables

Add these variables to your `.env` file:

```bash
# Better Auth Configuration
BETTER_AUTH_SECRET=your-random-secret-key-here
BETTER_AUTH_URL=http://localhost:5173

# For production, update to your domain:
# BETTER_AUTH_URL=https://yourdomain.com
```

Generate a secure secret:

```bash
openssl rand -hex 32
```

### 3. Push Database Schema

Create the bauth schema and tables in your database:

```bash
npm run db:push
```

This will create:

- The `bauth` schema
- The `typeUserRole` enum
- All four auth tables with proper relations

### 4. Files Created

#### Server-Side Files

1. **`src/lib/server/auth.ts`** - Better-auth configuration
   - Database adapter setup
   - Email/password authentication enabled
   - Type exports for Session and User

2. **`src/routes/api/auth/[...all]/+server.ts`** - API catch-all route
   - Handles all auth API calls (sign-in, sign-up, sign-out, session refresh, etc.)

#### Client-Side Files

3. **`src/lib/auth.ts`** - Client authentication helper
   - Exports `signIn`, `signUp`, `signOut` functions
   - Exports `session` store for reactive session state

4. **`src/routes/login/+page.svelte`** - Login/signup page
   - Email/password sign-in form
   - Email/password sign-up form
   - Toggle between sign-in and sign-up modes
   - Loading states and error handling
   - DaisyUI styling

#### Schema Updates

5. **`src/lib/server/db/shared/schema.ts`** - Database schema
   - Added `bauth` schema definition
   - Added `typeUserRole` enum
   - Added all four auth tables

6. **`.env.example`** - Updated with auth variables

## Usage

### Using Authentication in Your App

#### Check if User is Logged In

```svelte
<script lang="ts">
  import { session } from '$lib/auth';

  // session is a Svelte store that reactively updates
</script>

{#if $session?.user}
  <p>Welcome, {$session.user.name}!</p>
  <p>Role: {$session.user.role}</p>
{:else}
  <a href="/login">Login</a>
{/if}
```

#### Sign Out

```svelte
<script lang="ts">
  import { signOut } from '$lib/auth';

  async function handleSignOut() {
    await signOut();
  }
</script>

<button onclick={handleSignOut}>Sign Out</button>
```

#### Protect Routes (Server-Side)

Create a `+page.server.ts` file:

```typescript
import { auth } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (!session) {
		throw redirect(303, '/login');
	}

	// Check role if needed
	if (session.user.role !== 'admin') {
		throw redirect(303, '/unauthorized');
	}

	return {
		user: session.user
	};
};
```

#### Check Roles

The user object includes a `role` field with one of three values:

- `'user'` - Regular user (default)
- `'moderator'` - Moderator with elevated permissions
- `'admin'` - Administrator with full permissions

### API Endpoints

Better-auth automatically creates these endpoints at `/api/auth/*`:

- `POST /api/auth/sign-in/email` - Sign in with email/password
- `POST /api/auth/sign-up/email` - Create new account
- `POST /api/auth/sign-out` - Sign out
- `GET /api/auth/session` - Get current session
- Plus many more for OAuth, password reset, etc.

## User Roles

### Changing User Roles

User roles must be changed directly in the database for now. You can:

1. Use Drizzle Studio:

```bash
npm run db:studio
```

2. Use SQL:

```sql
UPDATE bauth.user
SET role = 'admin'
WHERE email = 'user@example.com';
```

### Recommended: Create Admin Script

You may want to create a script to promote users to admin:

```typescript
// scripts/promote-admin.ts
import { db } from './src/lib/server/db';
import { bauthUser } from './src/lib/server/db/shared/schema';
import { eq } from 'drizzle-orm';

const email = process.argv[2];

if (!email) {
	console.error('Usage: node scripts/promote-admin.ts <email>');
	process.exit(1);
}

await db.update(bauthUser).set({ role: 'admin' }).where(eq(bauthUser.email, email));

console.log(`User ${email} promoted to admin`);
```

## Security Notes

1. **Secret Key**: Always use a strong, randomly generated secret in production
2. **HTTPS**: Use HTTPS in production (update `BETTER_AUTH_URL`)
3. **Email Verification**: Consider enabling `requireEmailVerification: true` in production
4. **Password Requirements**: Minimum 8 characters enforced on the client
5. **Sessions**: Sessions automatically expire and can be configured in `auth.ts`

## Next Steps

1. **Email Verification**: Set up an email provider and enable email verification
2. **OAuth Providers**: Add social login (Google, GitHub, etc.)
3. **Password Reset**: Implement forgot password functionality
4. **Two-Factor Auth**: Add 2FA for enhanced security
5. **Rate Limiting**: Add rate limiting to prevent brute force attacks
6. **Audit Logging**: Track authentication events

## Testing the Setup

1. Start your dev server:

```bash
npm run dev
```

2. Navigate to `http://localhost:5173/login`

3. Create a test account:
   - Enter a name, email, and password (min 8 chars)
   - Click "Sign Up"

4. Sign in with your new account

5. Check the session by adding this to any page:

```svelte
<script>
  import { session } from '$lib/auth';
</script>

<pre>{JSON.stringify($session, null, 2)}</pre>
```

## Troubleshooting

### Database Schema Issues

If you get errors about missing tables or schema:

```bash
npm run db:push
```

### Session Not Persisting

Make sure cookies are enabled and check that `BETTER_AUTH_URL` matches your current URL.

### TypeScript Errors

Restart your TypeScript server in VS Code:

- Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
- Type "TypeScript: Restart TS Server"
- Press Enter

## Switching from NeonDB Auth

If you want to migrate from the existing NeonDB Auth setup to this Better Auth setup:

1. **Backup your current data**
2. **Update environment variables** (remove `NEON_AUTH_BASE_URL`, add `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`)
3. **Run database migration** (`npm run db:push`)
4. **Update your hooks.server.ts** to use the new auth system
5. **Update protected routes** to use the new session checking
6. **Migrate user data** if needed

## Resources

- [Better Auth Documentation](https://better-auth.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [SvelteKit Documentation](https://kit.svelte.dev)
