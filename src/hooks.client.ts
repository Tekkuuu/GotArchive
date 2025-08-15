import * as Sentry from '@sentry/sveltekit';
import type { HandleClientError } from "@sveltejs/kit";
import { dev } from '$app/environment';
import { sentry as sentryLogger, type SentryLoggerOptions } from '$lib/sentry/';
import _ from 'lodash';

Sentry.init({
  dsn: "https://cab45777ee0c5385707ca195a91428c6@o4509638308921344.ingest.de.sentry.io/4509638312001616",
  sendDefaultPii: true,
  enabled: !dev, // Disable Sentry in development mode
});

export const handleError: HandleClientError = ({ error, event }) => {
  let context: SentryLoggerOptions = {};

  _.set(context, 'tags.url', event.url.pathname);

  return sentryLogger.logClient(error, context);
}
