// See https://svelte.dev/docs/kit/types#app.d.ts
import type { CalendarRangeProps, CalendarMonthProps, CalendarDateProps } from 'cally';

type MapEvents<T> = {
	[K in keyof T as K extends `on${infer E}` ? `on:${Lowercase<E>}` : K]: T[K];
};

// for information about these interfaces
declare global {
	namespace App {
		interface Error {
			sentryErrorId?: string;
			status?: number;
		}
		interface Locals {
			session: {
				user: {
					id: string;
					name: string | null;
					email: string;
					image: string | null;
					emailVerified: boolean;
					createdAt: Date;
					updatedAt: Date;
					user_metadata?: {
						role?: 'admin' | 'moderator';
						[key: string]: any;
					};
				};
				session: {
					id: string;
					expiresAt: Date;
					token: string;
					createdAt: Date;
					updatedAt: Date;
					userId: string;
				};
			} | null;
			user: {
				id: string;
				name: string | null;
				email: string;
				image: string | null;
				emailVerified: boolean;
				createdAt: Date;
				updatedAt: Date;
				user_metadata?: {
					role?: 'admin' | 'moderator';
					[key: string]: any;
				};
			} | null;
		}
		interface PageData {}
		// interface PageState {}
		// interface Platform {}
		interface SvelteHTMLElements {
			'calendar-range': MapEvents<CalendarRangeProps>;
			'calendar-month': MapEvents<CalendarMonthProps>;
			'calendar-date': MapEvents<CalendarDateProps>;
		}
	}
}

export {};
