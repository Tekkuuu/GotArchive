import { eq, and, or } from 'drizzle-orm';
import type { ZodType } from 'zod/v4';
import { ERROR_CODES, AppError } from '$lib/errors';
import type { PgColumn } from 'drizzle-orm/pg-core';

export function idConfig<T extends Record<string, any>>(
	zodSchema: ZodType<T>,
	columnMap: { [K in keyof T]: PgColumn }
) {
	return {
		validator: (id: T | T[]): T | T[] => {
			// Accept single object or array of objects
			const result = Array.isArray(id) ? zodSchema.array().safeParse(id) : zodSchema.safeParse(id);
			if (!result.success) throw new AppError(ERROR_CODES.validation.INVALID_ID);
			return result.data;
		},
		where: (id: T | T[]) => {
			// Single: and(eq(...)), Multiple: or(and(eq(...)), and(eq(...)), ...)
			const toCondition = (obj: T) =>
				and(...Object.keys(columnMap).map((key) => eq(columnMap[key], obj[key as keyof T])));
			return Array.isArray(id) ? or(...id.map(toCondition)) : toCondition(id);
		}
	};
}
