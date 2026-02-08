import type { Snippet } from 'svelte';

export type ColumnData<T> = {
	header: string;
	row: Snippet<[T]>;
};
