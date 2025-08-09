<script lang="ts">
	import _ from 'lodash';

	interface Props {
		error: string | Array<string> | Record<string, any> | Array<Record<string, any>> | undefined;
		center?: boolean;
		config?: {
			compact: {
				strErr: boolean;
				strErrArray: boolean;
				objErr: boolean;
				objArrErr: boolean;
			};
		};
	}

	let {
		error,
		center = false,
		config = { compact: { strErr: false, strErrArray: true, objErr: false, objArrErr: true } }
	}: Props = $props();

	let stringError: string | undefined = $state(undefined);
	let stringArrayError: string[] | undefined = $state(undefined);
	let objectError: Record<string, any> | undefined = $state(undefined);
	let objectArrayError: Record<string, any>[] | undefined = $state(undefined);

	$effect(() => {
		if (_.isString(error)) {
			stringError = error;
		} else if (_.isObject(error) && !_.isArray(error)) {
			objectError = error;
		} else if (_.isArray(error)) {
			if (_.every(error, _.isString)) {
				stringArrayError = error;
			} else if (_.every(error, _.isObject)) {
				objectArrayError = error;
			}
		}
	});
</script>

{#snippet strErr(message: string, compact: boolean = false)}
	<div
		class={[
			!compact ? 'p-2' : 'px-2',
			'text-danger bg-primary-700 flex flex-1 items-center font-bold'
		]}
	>
		<span class="w-full">{message}</span>
	</div>
{/snippet}

{#snippet objErr(obj: Record<string, any>, compact: boolean = false)}
	<div class={[compact ? 'px-2' : 'p-2', 'bg-primary-700 grid h-full grid-cols-[auto_1fr]']}>
		{#each _.entries(obj) as ent}
			<span class={[!compact && 'py-1', 'text-primary-900 pr-2']}>{_.startCase(ent[0])}:</span>
			<span class={[!compact && 'py-1', 'text-danger font-bold']}>{ent[1]}</span>
		{/each}
	</div>
{/snippet}

{#if error !== undefined}
	<div class={[center && 'text-center', 'flex h-full']}>
		{#if stringError !== undefined}
			{@render strErr(stringError, config.compact.strErr)}
		{:else if objectError !== undefined}
			{@render objErr(objectError, config.compact.objErr)}
		{:else if stringArrayError !== undefined}
			{#each stringArrayError as err}
				{@render strErr(err, config.compact.strErrArray)}
			{/each}
		{:else if objectArrayError !== undefined}
			<div class="bg-primary-700 flex flex-col gap-1">
				{#each objectArrayError as err}
					{@render objErr(err, config.compact.objArrErr)}
				{/each}
			</div>
		{/if}
	</div>
{/if}
