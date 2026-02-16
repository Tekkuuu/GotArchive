import type { HandleClientError } from '@sveltejs/kit';
import { logger } from '$lib/client/logger';

export const handleError: HandleClientError = ({ event }) => {
	logger.error('Unhandled error in client', {
		pathname: event.url.pathname
	});
};
