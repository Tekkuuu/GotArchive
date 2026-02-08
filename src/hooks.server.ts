import * as Sentry from '@sentry/sveltekit';
import { type Handle, type HandleServerError, redirect } from '@sveltejs/kit';
import { sentry as sentryLogger, type SentryLoggerOptions } from '$lib/sentry/';
import _ from 'lodash';
import { dev } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';
import { auth } from '$lib/server/auth';

Sentry.init({
	dsn: 'https://cab45777ee0c5385707ca195a91428c6@o4509638308921344.ingest.de.sentry.io/4509638312001616',
	sendDefaultPii: true,
	enabled: !dev // Disable Sentry in development mode
});

export const handleError: HandleServerError = ({ error, event }) => {
	let context: SentryLoggerOptions = {};

	_.set(context, 'tags.url', event.url.pathname);

	return sentryLogger.logServer(error, context);
};

export const authHandle: Handle = async ({ event, resolve }) => {
	let user = (await auth.api.getSession(event.request))?.user;

	if (
		event.url.pathname.startsWith('/admin') &&
		(!user || !['admin', 'moderator'].includes(user.role))
	) {
		throw redirect(303, '/unauthorized');
	}

	return await resolve(event);
};

export const handle: Handle = sequence(Sentry.sentryHandle(), authHandle);
