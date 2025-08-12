import * as z from 'zod/v4';
import { feedbackStatuses } from '$lib/api';

export const deleteFormSchema = z.object({
  feedbackId: z.number().int().positive()
});

export const updateFormSchema = z.object({
  feedbackId: z.number().int().positive(),
  status: z.enum(feedbackStatuses),
});
