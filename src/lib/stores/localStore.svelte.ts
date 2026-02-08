import { browser } from '$app/environment';

export function localStore<T>(key: string, initial: T) {
	const serialize = (value: T) => JSON.stringify(value);
	const deserialize = (item: string): T => JSON.parse(item);

	function getInitialValue(): T {
		if (!browser) return initial;
		const stored = localStorage.getItem(key);
		return stored ? deserialize(stored) : initial;
	}

	let state = $state(getInitialValue());

	$effect(() => {
		if (browser) {
			localStorage.setItem(key, serialize(state));
		}
	});

	return {
		get value() {
			return state;
		},
		set(newValue: T) {
			state = newValue;
		},
		update(updater: (current: T) => T) {
			state = updater(state);
		}
	};
}
