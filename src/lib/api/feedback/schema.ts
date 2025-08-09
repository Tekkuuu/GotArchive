import * as z from 'zod/v4';

export const feedbackSchema = z.object({
  anonymousUUID: z.uuid().optional(),
  text: z.string().min(1).max(1000),
  honeypot: z.string().max(0).optional()
});
