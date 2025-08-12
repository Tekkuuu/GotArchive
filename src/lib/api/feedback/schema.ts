import * as z from 'zod/v4';

export const feedbackTags = ['bug', 'feature request', 'question', 'other'];
export const feedbackStatuses = ['open', 'inprogress', 'closed', 'wontfix'];

export const feedbackSchema = z.object({
  anonymousUUID: z.uuid().optional(),
  text: z.string().min(1).max(1000),
  honeypot: z.string().max(0).optional(),
  tag: z.enum(feedbackTags),
  contactInfo: z.string().max(200).optional(),
});
