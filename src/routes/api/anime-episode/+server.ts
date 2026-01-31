import { json, type RequestHandler } from '@sveltejs/kit';
import { services, db, schema } from '$lib/server/db';
import { eq, and, SQL } from 'drizzle-orm';
import * as z from 'zod';
import { handleApiError } from '$lib/api';
import { sentry } from '$lib/sentry';

export const GET: RequestHandler = async ({ request, setHeaders, url, locals }) => {
  try {
    const referer = request.headers.get('referer') || '';

    const animeId = z.coerce.number().int().positive().optional().safeParse(url.searchParams.get('animeId'));
    const sequence = z.coerce.number().int().positive().optional().safeParse(url.searchParams.get('sequence'));
    const detailed = url.searchParams.has('detailed');

    let data: Awaited<ReturnType<typeof services.animeEpisode.selectDetails>> | Awaited<ReturnType<typeof services.animeEpisode.select>>;

    if (detailed) {
      sentry.addBreadcrumb({
        category: 'db.request',
        message: `Fetching detailed animeEpiosde data`,
        level: 'info',
        data: {
          animeId: animeId.data,
          sequence: sequence.data
        }
      });
      data = await services.animeEpisode.selectDetails(db, animeId.data, sequence.data);
    } else {
      sentry.addBreadcrumb({
        category: 'db.request',
        message: `Fetching animeEpiosde data`,
        level: 'info',
        data: {
          animeId: animeId.data,
          sequence: sequence.data
        }
      });

      let cond: SQL[] = [];
      if (animeId.data) {
        cond.push(eq(schema.animeEpisode.animeId, animeId.data));
      }
      if (sequence.data) {
        cond.push(eq(schema.animeEpisode.sequence, sequence.data));
      }

      if (cond.length === 0) {
        data = [];
      } else {
        data = await services.animeEpisode.select(db, and(...cond));
      }
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
  } catch (err) {
    let tags = {
      source: `services.animeEpisode.${url.searchParams.has('detailed') ? 'selectDetails' : 'select'}`,
    }

    return handleApiError(err, locals, url, tags);
  }
};
