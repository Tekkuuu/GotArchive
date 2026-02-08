import { json, type RequestHandler } from '@sveltejs/kit';
import { useWatchingWeek } from '$lib/hooks';
import { AppError } from '$lib/errors';
import { sentry } from '$lib/sentry';
import { handleApiError } from '$lib/api';

export const GET: RequestHandler = async ({ params, request, locals, url, setHeaders }) => {
	try {
		const referer = request.headers.get('referer') || '';

		if (params.datecode) {
			sentry.addBreadcrumb({
				category: 'db.request',
				message: `Fetching watching this week data for datecode ${params.datecode}`,
				level: 'info',
				data: {
					datecode: params.datecode
				}
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
			throw new AppError('A datecode parameter is required.', 400);
		}
	} catch (err) {
		let tags = {
			source: 'useWatchingWeek'
		};
		return handleApiError(err, locals, url, tags);
	}
};
