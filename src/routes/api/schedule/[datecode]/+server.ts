import { json, error, type RequestHandler } from '@sveltejs/kit';
import { useSchedule } from '$lib/hooks/useSchedule';
import { handleApiError } from '$lib/api';
import { AppError, ERROR_CODES } from '$lib/errors';
import { logger } from '$lib/server/logger';

export const GET: RequestHandler = async ({ params, locals, url, request, setHeaders }) => {
	try {
		const referer = request.headers.get('referer') || '';
		const previewParam = url.searchParams.get('preview');
		let preview: boolean | undefined = undefined;
		if (previewParam === 'true') {
			preview = true;
		} else if (previewParam === 'false') {
			preview = false;
		}

		if (params.datecode) {
			logger.debug('Fetching schedule data', {
				datecode: params.datecode,
				preview,
				endpoint: url.pathname
			});

			const data = await useSchedule(params.datecode, { preview });

			if (!data.scheduleInfo) {
				error(404, 'Schedule not found for give year and week');
			}

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
			source: `useSchedule`
		};
		return handleApiError(err, locals, url, tags);
	}
};
