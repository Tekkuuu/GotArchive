import { browser } from '$app/environment';
import { DEFAULT_TIME_ZONE, browserTimeZone, parseTzParam } from '$lib/api/schedule/datecode';
import { localStore } from './localStore.svelte';

/**
 * Persisted display timezone. Holds a concrete IANA zone; on first load it is
 * seeded with the detected browser zone (falling back to {@link DEFAULT_TIME_ZONE}).
 * `?tz=` query values take precedence at read time but are not written here.
 */
export const TIME_ZONE_STORAGE_KEY = 'tz';

type TimeZoneStore = ReturnType<typeof localStore<string>>;

let store: TimeZoneStore | undefined;

/** Initial zone: detected browser zone, else UTC. */
function initialZone(): string {
	if (!browser) return DEFAULT_TIME_ZONE;
	return parseTzParam(browserTimeZone()) ?? DEFAULT_TIME_ZONE;
}

/**
 * Shared persistent timezone store (singleton).
 * @returns The store instance.
 */
export function getTimeZoneStore(): TimeZoneStore {
	if (!store) {
		store = localStore<string>(TIME_ZONE_STORAGE_KEY, initialZone());
	}
	return store;
}

/**
 * Resolves the effective display zone: explicit `?tz=` param wins, otherwise the
 * persisted store value, otherwise the detected zone, otherwise UTC.
 * @param raw - Raw `tz` query value (null = not set).
 * @returns Zone to render times in (never null).
 */
export function resolveTimeZone(raw: string | null): string {
	if (raw?.trim()) return parseTzParam(raw) ?? DEFAULT_TIME_ZONE;
	return getTimeZoneStore().value;
}

/**
 * Persists the user's timezone choice.
 * @param raw - Raw `tz` value (`null`/empty resets to the detected zone).
 */
export function setTimeZone(raw: string | null): void {
	const resolved = raw?.trim()
		? (parseTzParam(raw) ?? DEFAULT_TIME_ZONE)
		: (parseTzParam(browserTimeZone()) ?? DEFAULT_TIME_ZONE);
	getTimeZoneStore().set(resolved);
}
