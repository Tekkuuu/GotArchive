import * as Sentry from '@sentry/sveltekit';
import type { SentryLoggerOptions } from './types';
import { AppError, AnilistError, ServiceError } from '$lib/errors';
import _ from 'lodash';

const makeSentryLogger = () => {
	function logServer(error: unknown, options?: SentryLoggerOptions): App.Error {
		return Sentry.withScope((scope) => {
			let out: App.Error = {
				message: 'An unexpected error has occurred',
				status: 500
			};

			let server: string = 'unexpected';

			if (error instanceof AppError) {
				server = 'app';

				out.status = error.httpStatus;

				if (options?.user) {
					scope.setUser(options.user);
				}

				if (options?.tags) {
					scope.setTags(options.tags);
				}

				if (error instanceof ServiceError) {
					scope.setTag('app.error.code', error.code);
					server = 'service';
				}

				if (error instanceof AnilistError) {
					scope.setTag('app.error.code', error.code);
					scope.setContext('details', error.details || null);
					server = 'anilist';
				}

				out.message = error.message || 'An error occured';
			} else if (error instanceof Error) {
				if (error.message) {
					out.message = error.message;
				} else {
					out.message = 'An unexpected error has occurred';
				}
			} else {
				out.message = 'An unexpected non-standard error has occurred';
				scope.setContext('rawError', { error });
			}

			scope.setTag('server', server);

			out.sentryErrorId = Sentry.captureException(error, {
				mechanism: {
					type: 'sveltekit',
					handled: options?.handled ?? false
				}
			});

			return out;
		});
	}

	function logClient(error: unknown, options?: SentryLoggerOptions): App.Error {
		return Sentry.withScope((scope) => {
			let out: App.Error = {
				message: 'An unexpected error has occurred',
				status: 400
			};

			if (options?.user) {
				scope.setUser(options.user);
			}

			if (options?.tags) {
				scope.setTags(options.tags);
			}

			if (options?.breadcrumb) {
				scope.addBreadcrumb(options.breadcrumb);
			}

			if (_.has(error, 'status')) {
				out.status = _.get(error, 'status', 400);
			}

			const errorId = Sentry.captureException(error, {
				mechanism: {
					type: 'sveltekit',
					handled: options?.handled ?? false
				}
			});

			const errorMessage =
				error instanceof Error ? error.message : 'An unexpected error has occurred';

			_.set(out, 'sentryErrorId', errorId);
			out.message = errorMessage;

			return out;
		});
	}

	function addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
		Sentry.addBreadcrumb(breadcrumb);
	}

	return {
		logServer,
		logClient,
		addBreadcrumb
	};
};

export const logger = makeSentryLogger();
