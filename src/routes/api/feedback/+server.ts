import { actionResult, setMessage, superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { sentry } from "$lib/sentry";
import { handleApiError, type ApiErrorResponse } from "$lib/api";
import { feedbackSchema } from "$lib/api";
import _ from 'lodash';
import type { RequestHandler } from "@sveltejs/kit";
import { rateLimit } from "$lib/server/redis";
import type { Tables } from '$lib/database.types';

export const POST: RequestHandler = async ({ request, locals, url }) => {
  const form = await superValidate(request, zod4(feedbackSchema));
  if (!form.valid) {
    return actionResult('failure', { form });
  }

  const ip = request.headers.get('x-forwarded-for');
  const uuid = form.data.anonymousUUID;
  const rateKey = `feedback:${uuid ?? ip}`;
  const allowed = await rateLimit(rateKey, 5, 3600); // 1 request per minute

  if (!allowed) {
    return actionResult('error', { text: 'You are sending feedback too frequently. Please wait a while before trying again.' }, 400);
  }

  try {
    sentry.addBreadcrumb({ message: 'Inserting feedback', data: form.data });
    let { error } = await locals.supabase.from('feedback').insert(
      {
        text: form.data.text,
        tag: form.data.tag as Tables<'feedback'>['tag'] || undefined,
        contact_info: form.data.contactInfo
      }
    );

    if (error) throw error;

    setMessage(form, 'Feedback sent successfully!');
    return actionResult('success', { form });
  } catch (err) {
    let tags = {
      source: `supabase.feedback.insert`,
    }

    const errorData: ApiErrorResponse = await handleApiError(err, locals, url, tags).json();
    return actionResult('error', errorData.error.message)
  }
}
