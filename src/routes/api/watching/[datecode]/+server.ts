import { json, type RequestHandler } from '@sveltejs/kit';
import { useWatchingWeek } from '$lib/hooks';
import { AppError, ERROR_CODES } from '$lib/errors';
import { handleApiError } from '$lib/api';
import { logger } from '$lib/server/logger';

export const GET: RequestHandler = async ({ params, request, locals, url, setHeaders }) => {
	try {
		const referer = request.headers.get('referer') || '';

		if (params.datecode) {
			logger.debug({
				msg: 'Fetching watching this week data',
				datecode: params.datecode,
				endpoint: url.pathname
			});

			const data = await useWatchingWeek(params.datecode);

			// Set cache control headers
			// Default to 1 hour
			// If the referer is from admin pages set to no-store to always get accurate data
			let cacheControl = 'public, max-age=3600';
			if (referer.includes('/admin/')) {
				cacheControl = 'no-store';
			}

			setHeaders({
				'cache-control': cacheControl
			});

			return json(data);
		} else {
			throw new AppError(ERROR_CODES.validation.INVALID_SELECT_FILTERS, {
				context: { field: 'datecode', reason: 'A datecode parameter is required' }
			});
		}
	} catch (err) {
		let tags = {
			source: 'useWatchingWeek'
		};
		return handleApiError(err, locals, url, tags);
	}
};
