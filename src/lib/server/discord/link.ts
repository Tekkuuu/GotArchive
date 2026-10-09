import { db, schema, eq, and } from '$lib/server/db';

/** Minimal linked account view. */
export type LinkedUser = {
	id: string;
	name: string;
	role: string;
};

/**
 * Resolves a Discord id to its linked user.
 * @param discordId - Discord id.
 * @returns Linked user or null.
 */
export async function findLinkedUserByDiscordId(discordId: string): Promise<LinkedUser | null> {
	const rows = await db
		.select({
			id: schema.bauthUser.id,
			name: schema.bauthUser.name,
			role: schema.bauthUser.role
		})
		.from(schema.bauthAccount)
		.innerJoin(schema.bauthUser, eq(schema.bauthAccount.userId, schema.bauthUser.id))
		.where(
			and(
				eq(schema.bauthAccount.providerId, 'discord'),
				eq(schema.bauthAccount.accountId, discordId)
			)
		)
		.limit(1);

	return rows[0] ?? null;
}
