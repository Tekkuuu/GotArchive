import type { User } from '@sentry/sveltekit';

export interface AppErrorOptions {
	cause?: unknown;
	metadata?: Record<string, unknown>;
}

export interface ServiceErrorOptions extends AppErrorOptions {
	overrideMessage?: string;
}

export interface AnilistErrorOptions extends AppErrorOptions {
	details?: Record<string, unknown>;
}

export interface FormErrorOptions extends AppErrorOptions {
	form?: string;
}
