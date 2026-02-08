import type { User, Breadcrumb } from '@sentry/sveltekit';

export interface SentryLoggerOptions {
	tags?: { [key: string]: string };
	user?: User;
	breadcrumb?: Breadcrumb;
	handled?: boolean;
}
