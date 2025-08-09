import { redirect } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
  login: async ({ request, locals: { supabase } }) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/2kN2p-admin-login-2025/callback'
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
