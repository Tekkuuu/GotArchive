import { type RequestHandler, json, error } from '@sveltejs/kit';
import { z } from 'zod/v4';
import { asc, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { isBotRequest } from '$lib/server/botAuth';
import { requireDiscordStaff } from '$lib/server/discord/permissions';
import { db, schema } from '$lib/server/db';
import { logger } from '$lib/server/logger';

const snowflake = z.string().regex(/^\d{17,20}$/, 'Must be a Discord id');
const MentionType = z.enum(['none', 'everyone', 'role']);

const TargetFields = z.object({
	guildId: snowflake,
	channelId: snowflake,
	label: z.string().trim().min(1).max(100),
	timeZone: z.string().trim().min(1).max(100).default('Europe/London'),
	mentionType: MentionType.default('none'),
	mentionRoleId: snowflake.nullable().default(null),
	enabled: z.boolean().default(true)
});

const TargetsBodySchema = z.discriminatedUnion('action', [
	z.object({
		action: z.literal('create'),
		discordId: snowflake,
		target: TargetFields
	}),
	z.object({
		action: z.literal('update'),
		discordId: snowflake,
		targetId: z.uuid(),
		target: TargetFields
	}),
	z.object({ action: z.literal('delete'), discordId: snowflake, targetId: z.uuid() }),
	z.object({
		action: z.literal('setEnabled'),
		discordId: snowflake,
		targetId: z.uuid(),
		enabled: z.boolean()
	}),
	z.object({
		action: z.literal('setPing'),
		discordId: snowflake,
		targetId: z.uuid(),
		mentionType: MentionType,
		mentionRoleId: snowflake.nullable().default(null)
	})
]);

function isUniqueViolation(err: unknown): boolean {
	return typeof err === 'object' && err !== null && (err as { code?: string }).code === '23505';
}

function normaliseRole(fields: z.infer<typeof TargetFields>): string | null {
	return fields.mentionType === 'role' ? fields.mentionRoleId : null;
}

async function requireStaffOrThrow(request: Request, discordId: string | null): Promise<void> {
	if (!env.BOT_API_TOKEN) {
		logger.error('BOT_API_TOKEN environment variable is not set');
		error(500, 'Server error');
	}
	if (!isBotRequest(request)) {
		logger.warn('Unauthorized attempt to use the bot targets API');
		error(401, 'Unauthorized');
	}
	const staff = discordId ? await requireDiscordStaff(discordId) : null;
	if (!staff) {
		logger.warn('Unauthorized bot targets access', { discordId });
		error(403, 'Forbidden');
	}
}

/** Lists announcement targets (staff only). */
export const GET: RequestHandler = async ({ request, url }) => {
	await requireStaffOrThrow(request, url.searchParams.get('discordId'));

	const targets = await db
		.select()
		.from(schema.discordTarget)
		.orderBy(asc(schema.discordTarget.label));

	return json({ targets });
};

/** Creates, updates, deletes, or toggles a target (staff only). */
export const POST: RequestHandler = async ({ request }) => {
	if (!env.BOT_API_TOKEN) {
		logger.error('BOT_API_TOKEN environment variable is not set');
		return error(500, 'Server error');
	}
	if (!isBotRequest(request)) {
		logger.warn('Unauthorized attempt to use the bot targets API');
		return error(401, 'Unauthorized');
	}

	const parsed = TargetsBodySchema.safeParse(await request.json().catch(() => ({})));
	if (!parsed.success) {
		return error(400, 'Invalid request body');
	}

	const staff = await requireDiscordStaff(parsed.data.discordId);
	if (!staff) {
		logger.warn('Unauthorized bot targets mutation', { discordId: parsed.data.discordId });
		return error(403, 'Forbidden');
	}

	if (
		parsed.data.action === 'setPing' &&
		parsed.data.mentionType === 'role' &&
		!parsed.data.mentionRoleId
	) {
		return error(400, 'role_id is required when ping is role.');
	}

	try {
		switch (parsed.data.action) {
			case 'create':
				await db.insert(schema.discordTarget).values({
					guildId: parsed.data.target.guildId,
					channelId: parsed.data.target.channelId,
					label: parsed.data.target.label,
					timeZone: parsed.data.target.timeZone,
					mentionType: parsed.data.target.mentionType,
					mentionRoleId: normaliseRole(parsed.data.target),
					enabled: parsed.data.target.enabled
				});
				break;
			case 'update':
				await db
					.update(schema.discordTarget)
					.set({
						guildId: parsed.data.target.guildId,
						channelId: parsed.data.target.channelId,
						label: parsed.data.target.label,
						timeZone: parsed.data.target.timeZone,
						mentionType: parsed.data.target.mentionType,
						mentionRoleId: normaliseRole(parsed.data.target),
						enabled: parsed.data.target.enabled,
						updatedAt: new Date()
					})
					.where(eq(schema.discordTarget.targetId, parsed.data.targetId));
				break;
			case 'delete':
				await db
					.delete(schema.discordTarget)
					.where(eq(schema.discordTarget.targetId, parsed.data.targetId));
				break;
			case 'setEnabled':
				await db
					.update(schema.discordTarget)
					.set({ enabled: parsed.data.enabled, updatedAt: new Date() })
					.where(eq(schema.discordTarget.targetId, parsed.data.targetId));
				break;
			case 'setPing':
				await db
					.update(schema.discordTarget)
					.set({
						mentionType: parsed.data.mentionType,
						mentionRoleId:
							parsed.data.mentionType === 'role' ? parsed.data.mentionRoleId : null,
						updatedAt: new Date()
					})
					.where(eq(schema.discordTarget.targetId, parsed.data.targetId));
				break;
		}
	} catch (err) {
		if (isUniqueViolation(err)) {
			return error(409, 'A target for that server and channel already exists.');
		}
		logger.error('bot targets mutation failed', {
			action: parsed.data.action,
			error: err instanceof Error ? err.message : String(err)
		});
		return error(500, 'Server error');
	}

	return json({ success: true });
};
