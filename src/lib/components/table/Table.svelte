<script lang="ts" generics="Data extends Record<string, any>">
	import _ from 'lodash';
	import { flip } from 'svelte/animate';
	import { slide } from 'svelte/transition';
	import TableHeaderRow from './TableHeaderRow.svelte';
	import TableHeaderCell from './TableHeaderCell.svelte';
	import TableBodyRow from './TableBodyRow.svelte';
	import TableBodyCell from './TableBodyCell.svelte';
	import { ChevronUp, X } from 'lucide-svelte';
	import { sineInOut } from 'svelte/easing';
	import { dnd } from '$lib/attachments';
	import Fuse from 'fuse.js';
	import type { ColumnData } from './types';

	interface Props {
		data: Array<Data>;
		sortable?: boolean;
		filterable?: boolean;
		columns?: Array<ColumnData<Data>>;
	}

	let { data, sortable = false, filterable = false, columns }: Props = $props();

	let openSorting = $state(false);
	let sortBy: Array<[string, 'asc' | 'desc']> = $state(
		_.keys(_.head(data)).map((key) => [key, 'asc'])
	);

	let search = $state('');

	function swap<T>(arr: T[], i: number, j: number) {
		const newArr = arr.slice();
		[newArr[i], newArr[j]] = [newArr[j], newArr[i]];
		return newArr;
	}

	function applySort() {
		const keys = sortBy.map(([key]) => key);
		const orders = sortBy.map(([_, order]) => order);

		return _.orderBy(data, keys, orders);
	}

	function onSort(from: number, to: number) {
		sortBy = swap(sortBy, from, to);
	}

	function filter(anime: typeof data): typeof data {
		const normalizedInput = _.deburr(search);

		if (normalizedInput.length < 1) {
			return anime;
		}

		const fuse = new Fuse(anime, {
			keys: _.keys(_.head(anime)),
			threshold: 0.2,
			ignoreLocation: true,
			minMatchCharLength: 2
		});

		const result = fuse.search(normalizedInput);
		return result.map((r) => r.item);
	}
</script>

<div class="dark:text-primary-50 text-primary-900">
	{#if sortable}
		<div
			class={[
				'dark:bg-primary-700 bg-primary-200 border-primary-400',
				'grid grid-cols-3 items-center border-b-2 p-2'
			]}
		>
			<span class={['col-start-2 text-center text-xl font-bold']}>Sorting</span>
			<button
				class={[
					'aspect-square w-fit justify-self-end',
					'border-primary-400 rounded-full border p-1',
					'hover:bg-primary-400 transtion-all duration-150'
				]}
				onclick={(e) => {
					e.preventDefault();
					openSorting = !openSorting;
				}}
			>
				{#if openSorting}
					<X />
				{:else}
					<ChevronUp />
				{/if}
			</button>
		</div>
		{#if openSorting}
			<div
				transition:slide={{ axis: 'y', duration: 150, easing: sineInOut }}
				class={[
					'dark:text-primary-50 bg-primary-200 dark:bg-primary-700 text-primary-900',
					'flex w-full gap-1 p-2 max-md:flex-col',
					'border-primary-400 border-b-2'
				]}
			>
				{#each sortBy as sb, index (sb[0])}
					<div
						{@attach dnd(index, 'table', onSort)}
						class={[
							'touch-none',
							'bg-primary-300 dark:bg-primary-800 text-primary-900 dark:text-primary-50',
							'flex w-fit items-center justify-between gap-1 rounded-full p-2'
						]}
						animate:flip={{ duration: 150, easing: sineInOut }}
					>
						<span>{_.upperFirst(_.toLower(_.startCase(sb[0])))}</span>
						<button
							class={[
								'no-drag',
								'border-primary-400 rounded-full border p-1',
								'hover:bg-primary-400 transtion-all duration-150',
								sb[1] === 'asc' ? '*:rotate-0' : '*:rotate-180',
								'*:transition-all *:duration-150'
							]}
							onclick={(e) => {
								e.preventDefault();
								sortBy[index][1] = sb[1] === 'asc' ? 'desc' : 'asc';
							}}
						>
							<ChevronUp />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
	{#if filterable}
		<div
			class={['dark:bg-primary-700 bg-primary-200 border-primary-400', 'flex gap-1 border-b-2 p-2']}
		>
			<span>Search</span>
			<input type="text" bind:value={search} class="w-full outline-none" />
		</div>
	{/if}
	<div class="min-w-sm overflow-x-scroll">
		<table
			class={['dark:bg-primary-700 dark:text-primary-50 bg-primary-200 text-primary-900 w-full']}
		>
			<thead class="border-primary-400 border-b-2">
				<TableHeaderRow>
					{#each _.keys(_.head(data)) as header}
						<TableHeaderCell>
							{_.upperFirst(_.toLower(_.startCase(header)))}
						</TableHeaderCell>
					{/each}
					{#if columns}
						{#each columns as column}
							<TableHeaderCell>
								{_.upperFirst(_.toLower(_.startCase(column.header)))}
							</TableHeaderCell>
						{/each}
					{/if}
				</TableHeaderRow>
			</thead>
			<tbody>
				{#each filter(applySort()) as row}
					<TableBodyRow>
						{#each _.values(row) as entry}
							<TableBodyCell>{entry}</TableBodyCell>
						{/each}
						{#if columns}
							{#each columns as column}
								<TableBodyCell>
									{@render column.row(row)}
								</TableBodyCell>
							{/each}
						{/if}
					</TableBodyRow>
				{/each}
			</tbody>
		</table>
	</div>
</div>
