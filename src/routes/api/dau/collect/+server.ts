import { type RequestHandler, json, error } from '@sveltejs/kit';
import { Receiver } from '@upstash/qstash';
import {
	QSTASH_CURRENT_SIGNING_KEY,
	QSTASH_NEXT_SIGNING_KEY,
	DAU_COLLECT_URL
} from '$env/static/private';
import { handleApiError } from '$lib/api';
import { getDAU } from '$lib/server/redis';
import { db, services } from '$lib/server/db';

export const POST: RequestHandler = async ({ request, locals, url }) => {
	const receiver = new Receiver({
		currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
		nextSigningKey: QSTASH_NEXT_SIGNING_KEY
	});

	let source = 'api.dau.collect';

	try {
		const signature = request.headers.get('Upstash-Signature');
		const body = await request.text();

		if (!signature) {
			source = 'api.dau.signature';
			error(400, 'Bad request');
		}

		const isValid = await receiver.verify({
			body,
			signature,
			url: DAU_COLLECT_URL
		});

		if (isValid) {
			const now = new Date();
			now.setUTCDate(now.getUTCDate() - 1);
			const yesterday = now.toISOString().slice(0, 10);

			const dau = await getDAU(yesterday);
			if (!dau) {
				error(404, `DAU data not found for date: ${yesterday}`);
			}
			await db.transaction(async (tx) => {
				await services.dailyUsers.insert(tx, { date: yesterday, count: dau });
			});
		} else {
			source = 'api.dau.verify';
			error(400, 'Bad request');
		}

		return json({ ok: true });
	} catch (err) {
		return handleApiError(err, locals, url, { source });
	}
};
