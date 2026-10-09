import { findLinkedUserByDiscordId, type LinkedUser } from './link';

const STAFF_ROLES = ['admin', 'moderator'];

/**
 * Resolves a Discord user to a linked staff website account.
 * @param discordId - Discord snowflake.
 * @returns The linked staff user, or null when unlinked or not staff.
 */
export async function requireDiscordStaff(discordId: string): Promise<LinkedUser | null> {
	const user = await findLinkedUserByDiscordId(discordId);
	if (!user || !STAFF_ROLES.includes(user.role)) return null;
	return user;
}
