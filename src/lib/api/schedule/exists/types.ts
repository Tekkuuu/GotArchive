import { z } from 'zod';

export const ValidateDateSchema = z.object({
	year: z.number().int().min(1900).max(2100),
	week: z.number().int().min(1).max(53)
});

export type APIValidateDateRequest = z.infer<typeof ValidateDateSchema>;
export type APIValidateDateResponse = { exists: boolean | null; message?: string };
