<script lang="ts">
	import type { PageProps } from './$types';
	import _ from 'lodash';
	import { X, Pencil, Check } from 'lucide-svelte';
	import { toast } from '$lib/components/ui/toaster';
	import { superForm } from 'sveltekit-superforms';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { formSchema } from './util';
	import Fuse from 'fuse.js';

	let { data }: PageProps = $props();

	let { form, enhance, errors, submit } = superForm(data.form, {
		dataType: 'json',
		validators: zod4Client(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Anime deleted successfully');
			} else if (result.type === 'failure') {
				toast.error(result.data?.text || 'Failed to delete anime', 5000);
			} else if (result.type === 'error') {
				toast.error('An unexpected error occurred', 5000);
			}
		}
	});

	function filterAnime() {
		if (search.trim().length === 0) return data.anime;

		let fuse = new Fuse(data.anime, {
			keys: ['titleNative', 'titleRomaji', 'titleEnglish'],
			threshold: 0.3,
			ignoreDiacritics: true,
			minMatchCharLength: 2
		});

		return fuse.search(search).map((result) => result.item);
	}

	let search = $state('');
</script>

<svelte:head>
	<title>Admin | Edit anime | G.O.T Archive</title>
</svelte:head>

<div class="flex w-full flex-col gap-1">
	<form method="POST" use:enhance action="?/delete" class="hidden">
		<input type="number" bind:value={$form.animeId} />
	</form>
	<label class="input w-full">
		<span class="label">Search</span>
		<input type="text" bind:value={search} />
	</label>
	<div class="rounded-box border-base-content/5 overflow-x-auto border">
		<table class="table-xs table">
			<thead>
				<tr class="uppercase">
					{#each _.keys(_.head(data.anime)) as header}
						<th>{_.lowerCase(header)}</th>
					{/each}
					<th>actions</th>
				</tr>
			</thead>
			<tbody>
				{#each filterAnime() as rowData}
					<tr>
						{#each _.entries(rowData) as cell}
							{#if cell[0] === 'logoUrl'}
								{#if cell[1]}
									<td class="badge badge-xs badge-success"><Check /></td>
								{:else}
									<td class="badge badge-xs badge-error"><X /></td>
								{/if}
							{:else}
								<td>{cell[1]}</td>
							{/if}
						{/each}
						<td class="flex flex-nowrap gap-2">
							<a href={`/admin/edit/anime/${rowData.animeId}`} class="btn btn-xs btn-warning">
								<Pencil />
							</a>
							<button
								type="button"
								class="btn btn-xs btn-error"
								onclick={() => {
									$form.animeId = rowData.animeId;
									submit();
								}}
							>
								<X />
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
