import * as z from 'zod';

export const deleteFormSchema = z.object({
  scheduleId: z.number().int().positive()
})

export const previewFormSchema = z.object({
  scheduleId: z.number().int().positive(),
  preview: z.boolean()
});
