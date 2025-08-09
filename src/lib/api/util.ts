import { sentry } from '$lib/sentry';
import { AppError } from '$lib/errors';
import type { ApiErrorResponse } from './types';
import { json } from '@sveltejs/kit';

/**
 * Handles API errors by logging them to Sentry and returning a standardized JSON error response.
 * If the error is an instance of AppError, it logs the error, attaches user and page info,
 * and returns a JSON response with the error message and Sentry error ID.
 * Unexpected errors are re-thrown.
 *
 * @param error - The error object, can be any type.
 * @param locals - Application locals, used to extract session/user info.
 * @param url - The request URL, used to tag the error with the page.
 * @param tags - Metadata tags for error logging, must include a 'source' property.
 * @returns A JSON response with error details if handled, otherwise re-throws the error.
 */
export function handleApiError(
  error: unknown,
  locals: App.Locals,
  url: URL,
  tags: { source: string, [key: string]: string }
) {
  if (error instanceof AppError) {
    let user = locals.session?.user.id ? { id: locals.session.user.id } : undefined;
    tags.page = `API: ${url.pathname}`;

    const errorId = sentry.logServer(error, { tags, user });

    const payload: ApiErrorResponse = {
      error: {
        message: error.message,
        sentryErrorId: errorId.sentryErrorId
      }
    }

    return json(payload, { status: error.httpStatus });
  }

  throw error; // Re-throw unexpected errors
}
