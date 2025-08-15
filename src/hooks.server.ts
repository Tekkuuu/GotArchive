import { PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import * as Sentry from '@sentry/sveltekit';
import { createServerClient } from '@supabase/ssr';
import { type Handle, type HandleServerError, redirect } from '@sveltejs/kit';
import { sentry as sentryLogger, type SentryLoggerOptions } from '$lib/sentry/';
import _ from 'lodash';
import { dev } from '$app/environment';
import { sequence } from '@sveltejs/kit/hooks';

Sentry.init({
  dsn: "https://cab45777ee0c5385707ca195a91428c6@o4509638308921344.ingest.de.sentry.io/4509638312001616",
  sendDefaultPii: true,
  enabled: !dev, // Disable Sentry in development mode
})

const supabase: Handle = async ({ event, resolve }) => {
  /**
   * Creates a Supabase client specific to this server request.
   *
   * The Supabase client gets the Auth token from the request cookies.
   */
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      /**
       * SvelteKit's cookies API requires `path` to be explicitly set in
       * the cookie options. Setting `path` to `/` replicates previous/
       * standard behavior.
       */
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' })
        })
      },
    },
  })

  /**
   * Unlike `supabase.auth.getSession()`, which returns the session _without_
   * validating the JWT, this function also calls `getUser()` to validate the
   * JWT before returning the session.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()
    if (!session) {
      return { session: null, user: null }
    }

    const {
      data: { user },
      error,
    } = await event.locals.supabase.auth.getUser()
    if (error) {
      // JWT validation has failed
      return { session: null, user: null }
    }

    return { session, user }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      /**
       * Supabase libraries use the `content-range` and `x-supabase-api-version`
       * headers, so we need to tell SvelteKit to pass it through.
       */
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession()
  event.locals.session = session
  event.locals.user = user

  const { data, error } = await event.locals.supabase.from('users').select('*').eq('supabase_id', user?.id || '').single();
  const currentRole = error ? 'guest' : data?.role ?? 'guest';

  if (
    (!event.locals.session || currentRole !== 'admin')
    && event.url.pathname.startsWith('/admin')
  ) {
    redirect(303, '/')
  }

  if (
    (event.locals.session && currentRole === 'admin')
    && event.url.pathname === '/auth'
  ) {
    redirect(303, '/admin')
  } else if (event.locals.session && event.url.pathname === '/auth') {
    redirect(303, '/');
  }

  return resolve(event)
}

export const handleError: HandleServerError = ({ error, event }) => {
  let context: SentryLoggerOptions = {};

  _.set(context, 'tags.url', event.url.pathname);

  return sentryLogger.logServer(error, context);
}

export const handle: Handle = sequence(Sentry.sentryHandle(), supabase, authGuard);
