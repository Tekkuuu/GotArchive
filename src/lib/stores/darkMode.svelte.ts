import { localStore } from './localStore.svelte';

type DarkModeStore = ReturnType<typeof localStore<boolean>>;

let store: DarkModeStore | undefined;

export function getDarkModeStore(): DarkModeStore {
	if (!store) {
		store = localStore<boolean>('darkMode', false);
	}
	return store;
}
