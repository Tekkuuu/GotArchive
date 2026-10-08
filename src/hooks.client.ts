import type { HandleClientError } from '@sveltejs/kit';

export const handleError: HandleClientError = ({ event, error }) => {
	console.error('[client] Unhandled error', {
		pathname: event.url.pathname,
		error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
	});
};
