<script lang="ts">
	import { Info } from 'lucide-svelte';

	interface Operator {
		token: string;
		meaning: string;
	}

	interface Props {
		value?: string;
		placeholder: string;
		fields: string[];
		operators: Operator[];
	}

	let { value = $bindable(''), placeholder, fields, operators }: Props = $props();
</script>

<div class="join w-full">
	<input type="search" bind:value {placeholder} class="input join-item w-full" />
	<div class="dropdown dropdown-end">
		<button type="button" tabindex="0" class="btn join-item h-full" aria-label="Search syntax">
			<Info class="size-4" />
		</button>
		<div class="dropdown-content bg-base-300 rounded-box z-10 mt-2 w-72 max-w-[90vw] p-4">
			<div class="space-y-3 text-sm">
				<div>
					<p class="mb-1 font-medium">Fields</p>
					<p class="text-base-content/70 flex flex-wrap gap-1">
						{#each fields as field (field)}
							<code class="bg-base-100 rounded p-1">{field}:</code>
						{/each}
					</p>
				</div>
				<div>
					<p class="mb-1 font-medium">Operators</p>
					<dl class="text-base-content/70 grid grid-cols-[auto_1fr] items-center gap-x-2 gap-y-1">
						{#each operators as operator (operator.token)}
							<dt><code class="bg-base-100 rounded p-1">{operator.token}</code></dt>
							<dd>{operator.meaning}</dd>
						{/each}
					</dl>
				</div>
			</div>
		</div>
	</div>
</div>
