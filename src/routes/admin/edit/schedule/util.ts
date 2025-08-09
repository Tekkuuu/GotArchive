import * as z from 'zod';

export const formSchema = z.object({
  scheduleId: z.number().int().positive()
})
