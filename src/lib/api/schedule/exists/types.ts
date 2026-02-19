import { ValidateDateSchema } from '$lib/schemas';
import type { z } from 'zod/v4';

export { ValidateDateSchema };
export type APIValidateDateRequest = z.infer<typeof ValidateDateSchema>;
export type APIValidateDateResponse = { exists: boolean | null; message?: string };
