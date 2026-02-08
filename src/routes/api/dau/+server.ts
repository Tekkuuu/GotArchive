import { type RequestHandler, json } from '@sveltejs/kit';
import { handleApiError } from '$lib/api';
import { updateDAU } from '$lib/server/redis';

export const POST: RequestHandler = async ({ request, locals, url }) => {
	let source = 'api.dau.post';
	try {
		const { uuid } = await request.json();
		if (!uuid) {
			source = 'api.dau.uuid';
			throw new Error('Missing required field: uuid');
		}

		await updateDAU(uuid);

		return json({ ok: true });
	} catch (err) {
		return handleApiError(err, locals, url, { source });
	}
};
