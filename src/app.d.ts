// See https://svelte.dev/docs/kit/types#app.d.ts

// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			status?: number;
		}
		interface Locals {
			session: {
				user: {
					id: string;
					name: string;
					email: string;
					emailVerified: boolean;
					image?: string | null;
					createdAt: Date;
					updatedAt: Date;
					role: string;
				};
				session: {
					id: string;
					expiresAt: Date;
					token: string;
					createdAt: Date;
					updatedAt: Date;
					userId: string;
					ipAddress?: string | null;
					userAgent?: string | null;
				};
			} | null;
			user: {
				id: string;
				name: string;
				email: string;
				emailVerified: boolean;
				image?: string | null;
				createdAt: Date;
				updatedAt: Date;
				role: string;
			} | null;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
