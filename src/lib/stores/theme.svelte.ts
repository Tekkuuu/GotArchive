import { localStore } from './localStore.svelte';

export const AVAILABLE_THEMES = [
	'gotlight',
	'gotdark',
	'gotlight-v2',
	'gotdark-v2',
	'dark',
	'light'
] as const;

export type Theme = (typeof AVAILABLE_THEMES)[number];

type ThemeStore = ReturnType<typeof localStore<Theme>>;

let store: ThemeStore | undefined;

export function getThemeStore(): ThemeStore {
	if (!store) {
		store = localStore<Theme>('theme', 'gotlight');
	}
	return store;
}
