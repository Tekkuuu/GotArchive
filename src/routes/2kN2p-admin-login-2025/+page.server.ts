import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { LOGIN_REDIRECT_URL } from '$env/static/private';

export const actions: Actions = {
  login: async ({ request, locals: { supabase } }) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: LOGIN_REDIRECT_URL
      }
    });

    if (error) {
      console.log(error);
      return fail(400, {
        message: "Something went wrong."
      })
    }

    if (data.url) {
      throw redirect(303, data.url);
    } else {
      return fail(400, {
        message: "Something went wrong."
      })
    }
  },
}
