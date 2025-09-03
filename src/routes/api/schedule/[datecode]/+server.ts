import { json, error, type RequestHandler } from '@sveltejs/kit';
import { useSchedule } from '$lib/hooks/useSchedule';
import { handleApiError } from '$lib/api';
import { AppError } from '$lib/errors';
import { sentry } from '$lib/sentry';

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
      sentry.addBreadcrumb({
        category: 'db.request',
        message: `Fetching schedule data for datecode ${params.datecode}`,
        level: 'info',
        data: {
          datecode: params.datecode
        }
      });

      const data = await useSchedule(params.datecode, { preview });

      if (!data.scheduleInfo) {
        error(404, "Schedule not found for give year and week");
      }

      // Set cache control headers
      // Default to 1 hour
      // If the referer is from admin pages set to no-store to always get accurate data
      let cacheControl = 'public, max-age=3600';
      if (referer.includes('/admin/')) {
        cacheControl = 'no-store';
      }

      setHeaders({
        'cache-control': cacheControl,
      });

      return json(data);
    } else {
      throw new AppError("A datecode parameter is required.", 400);
    }
  } catch (err) {
    let tags = {
      source: `useSchedule`,
    }
    return handleApiError(err, locals, url, tags);
  }
};
