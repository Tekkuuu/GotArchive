import { localStore } from './localStore.svelte';

type AnonymousUUID = ReturnType<typeof localStore<string>>;

let store: AnonymousUUID | undefined;

export function getAnonymousUUIDStore(): AnonymousUUID {
  if (!store) {
    store = localStore<string>('anonymousUUID', crypto.randomUUID());
  }
  return store;
}
