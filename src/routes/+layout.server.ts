import type { LayoutServerLoad } from './$types';
import { db, schema } from '$lib/server/db';
import { asc } from 'drizzle-orm';
import { sanitizeHexColor, sanitizeIconSvg } from '$lib/server/util/sanitizeHtml';
import { logger } from '$lib/server/logger';
import type { SocialPlatform } from '$lib/components/ui/socials';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Never expose the raw session token (a bearer secret) to the client.
	const session = locals.session
		? { ...locals.session, session: { ...locals.session.session, token: undefined } }
		: null;

	let platforms: SocialPlatform[] = [];
	try {
		const rows = await db
			.select({
				platformId: schema.platform.platformId,
				name: schema.platform.name,
				url: schema.platform.url,
				iconSvg: schema.platform.iconSvg,
				iconColor: schema.platform.iconColor
			})
			.from(schema.platform)
			.orderBy(asc(schema.platform.name));
		platforms = rows.map((row) => ({
			...row,
			iconSvg: sanitizeIconSvg(row.iconSvg),
			iconColor: sanitizeHexColor(row.iconColor)
		}));
	} catch (err) {
		logger.error('Failed to fetch platforms', {
			source: 'rootLayout',
			error: err instanceof Error ? err.message : String(err)
		});
	}

	return { session, platforms };
};
