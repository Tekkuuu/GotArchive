import type { LayoutServerLoad } from './$types'
import { superValidate } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import { feedbackSchema } from '$lib/api';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
  const { session, user } = await safeGetSession()

  const form = await superValidate(zod4(feedbackSchema))

  return {
    form,
    session,
    user,
    cookies: cookies.getAll(),
  }
}
