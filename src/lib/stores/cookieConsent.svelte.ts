import { localStore } from './localStore.svelte';

type CookieConsent = ReturnType<typeof localStore<{
  version: string;
  consent: boolean;
}>>;

let store: CookieConsent | undefined;

export const COOKIE_CONSENT_VERSION = '2';

export function getCookieConsentStore(): CookieConsent {
  if (!store) {
    store = localStore<{ version: string; consent: boolean }>('got_cookie_consent', {
      version: COOKIE_CONSENT_VERSION,
      consent: false,
    });
  }
  return store;
}
