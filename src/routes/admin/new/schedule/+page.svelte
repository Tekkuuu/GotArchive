<script lang="ts">
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';
	import { superForm } from 'sveltekit-superforms';
	import { formSchema } from './util';
	import { zod4Client } from 'sveltekit-superforms/adapters';
	import { toast } from '$lib/components/ui/toaster';
	import { Input, Label, Button, Select, TimeInput, DateInput } from '$lib/components/forms';
	import { Clock, Minus, Plus, Text } from 'lucide-svelte';
	import { addDays, addWeeks, getWeek, getYear, startOfISOWeek, format } from 'date-fns';
	import { formatWeekRange } from '$lib/util/';
	import type { AnimeEpisodeDetails } from '$lib/server/db';
	import { LucideIcon } from '$lib/components/util';
	import type { ApiErrorResponse } from '$lib/api';

	let { data }: PageProps = $props();
	let { form, enhance, errors } = superForm(data.form, {
		dataType: 'json',
		validators: zod4Client(formSchema),
		validationMethod: 'onsubmit',
		multipleSubmits: 'prevent',
		onResult: ({ result }) => {
			if (result.type === 'success') {
				toast.success('Schedule create successfully');
			} else if (result.type === 'error' || result.type === 'failure') {
				toast.error('Failed to create schedule');
			}
		}
	});

	let episodes: AnimeEpisodeDetails[] = $state([]);

	const today = new Date();

	async function fetchAnimeEpisodes(animeId: number) {
		if (episodes.find((e) => e.animeId === animeId) !== undefined) return;

		const response = await fetch(`/api/anime-episode?animeId=${animeId}&detailed`);

		if (response.ok) {
			episodes = [...episodes, ...(await response.json())];
		} else {
			try {
				const errorPayload: ApiErrorResponse = await response.json();
				toast.error(
					`${errorPayload.error.message}, Error ID: ${errorPayload.error.sentryErrorId || 'N/A'}`
				);
				console.error(`Error ID: ${errorPayload.error.sentryErrorId || 'N/A'}`);
			} catch (err) {
				toast.error('An unexptected error has occured');
			}
		}
	}

	function addEntry(weekday: number) {
		const jan4 = new Date(Date.UTC($form.schedule.year, 0, 4));
		const firstMonday = startOfISOWeek(jan4);
		const day = addDays(addWeeks(firstMonday, $form.schedule.week - 1), weekday);
		$form.entries = [
			...$form.entries,
			{
				platformIds: [],
				date: format(day, 'yyyy-MM-dd'),
				time: null,
				note: '',
				type: 'anime',
				data: {
					animeEpisodeIds: [],
					animeId: -1,
					watchedAfter: ''
				}
			}
		];
	}

	function getSelectTitleLabel(anime: (typeof data.anime)[number] | undefined): string {
		if (!anime) return '';
		return anime.titleEnglish ?? anime.titleRomaji ?? anime.titleNative;
	}

	onMount(() => {
		$form.schedule.year = getYear(addWeeks(today, 1));
		$form.schedule.week = getWeek(addWeeks(today, 1));
	});
</script>

<svelte:head>
	<title>Admin | New schedule | G.O.T Archive</title>
</svelte:head>

{#snippet entry(index: number)}
	<div class="flex flex-col gap-1 rounded-lg">
		<div class="grid grid-cols-2 gap-1 lg:grid-cols-5">
			<Select
				rounded
				placeholder="Entry type"
				options={data.scheduleEntryType.map((t) => ({ label: t, value: t }))}
				bind:selected={
					() => ({
						value: $form.entries[index].type,
						label: data.scheduleEntryType.find((t) => t === $form.entries[index].type) || ''
					}),
					(v) => ($form.entries[index].type = v.value)
				}
			/>
			<Select
				allowMultiple
				rounded
				placeholder="Select platforms"
				options={data.platforms.map((p) => ({ label: p.name, value: p.platformId }))}
				bind:selected={
					() =>
						$form.entries[index].platformIds.map((pId) => ({
							value: pId,
							label:
								data.platforms.find((p) => p.platformId === pId)?.name || 'An error has occurred'
						})),
					(v) => ($form.entries[index].platformIds = v.map((p) => p.value))
				}
			/>
			<DateInput bind:value={$form.entries[index].date} rounded />
			<TimeInput
				showSecond={false}
				bind:value={
					() => $form.entries[index].time || undefined,
					(v) => (!v ? ($form.entries[index].time = null) : ($form.entries[index].time = v))
				}
				rounded
			/>
			<Input
				appendClass="max-lg:col-span-2"
				rounded="lg"
				placeholder="Note"
				type="text"
				bind:value={
					() => $form.entries[index].note ?? '',
					(v) => (v === '' ? ($form.entries[index].note = null) : ($form.entries[index].note = v))
				}
			/>
		</div>
		{#if $form.entries[index].type === 'anime'}
			<div class="grid grid-cols-2 gap-1 min-md:grid-cols-3">
				<Select
					placeholder="Select anime"
					rounded
					search
					options={data.anime.map((a) => ({
						value: a.animeId,
						label: a.titleEnglish ?? a.titleRomaji ?? a.titleNative
					}))}
					bind:selected={
						() => ({
							value: $form.entries[index].data.animeId,
							label: getSelectTitleLabel(
								data.anime.find((a) => a.animeId === $form.entries[index].data.animeId)
							)
						}),
						(v) => ($form.entries[index].data.animeId = v.value)
					}
					onselect={async () => {
						await fetchAnimeEpisodes($form.entries[index].data.animeId);
					}}
				/>
				<Select
					placeholder="Select episodes"
					rounded
					search
					allowMultiple
					disabled={$form.entries[index].data.animeId <= 0}
					options={episodes
						.filter((e) => e.animeId === $form.entries[index].data.animeId)
						.map((e) => ({
							value: e.animeEpisodeId,
							label: `${e.titleEnglish ?? e.titleRomaji ?? e.titleNative}, Ep: ${e.episodeNumber.toString()}`
						}))}
					bind:selected={
						() =>
							$form.entries[index].data.animeEpisodeIds.map((e) => {
								const ep = episodes.find((ep) => ep.animeEpisodeId === e);
								return {
									value: e,
									label: `${ep?.titleEnglish || ep?.titleRomaji || ep?.titleNative || 'Error occurred'}, Ep: ${ep?.episodeNumber || 'Error occured'}`
								};
							}),
						(v) => ($form.entries[index].data.animeEpisodeIds = v.map((e) => e.value))
					}
				/>
				<Input
					appendClass="max-md:col-span-2"
					type="text"
					placeholder="Watch delay"
					rounded="lg"
					disabled={!($form.entries[index].date && $form.entries[index].time)}
					bind:value={$form.entries[index].data.watchedAfter}
				>
					<LucideIcon icon={Clock} />
				</Input>
			</div>
		{/if}
	</div>
{/snippet}

<div>
	<form method="POST" action="?/create" use:enhance class="flex flex-col gap-1">
		<div class="grid grid-cols-2 gap-1 sm:grid-cols-3">
			<Label labelFor="schedule-note" shape="rounded" appendClass="max-sm:order-1 max-sm:col-span-2"
				>Schedule note</Label
			>
			<Label labelFor="schedule-year" shape="rounded" appendClass="max-sm:order-3">Year</Label>
			<Label labelFor="schedule-week" shape="rounded" appendClass="max-sm:order-5">Week</Label>
			<Input
				appendClass="max-sm:order-2 max-sm:col-span-2"
				type="text"
				name="schedule-note"
				id="schedule-note"
				rounded="lg"
				bind:value={
					() => $form.schedule.note || '',
					(v) => (v === '' ? ($form.schedule.note = null) : ($form.schedule.note = v))
				}
			>
				<LucideIcon icon={Text} />
			</Input>
			<Input
				appendClass="max-sm:order-4"
				type="number"
				name="schedule-year"
				id="schedule-year"
				rounded="lg"
				bind:value={$form.schedule.year}
			>
				<LucideIcon icon={Text} />
			</Input>
			<Input
				appendClass="max-sm:order-6"
				type="number"
				name="schedule-week"
				id="schedule-week"
				rounded="lg"
				bind:value={$form.schedule.week}
			>
				<LucideIcon icon={Text} />
			</Input>
		</div>
		<span class="text-primary-900 dark:text-primary-50 text-center text-3xl font-bold">
			Entries
		</span>
		<span class="text-primary-600 dark:text-primary-400 text-center">
			{formatWeekRange($form.schedule.year, $form.schedule.week)}
		</span>
		{#each $form.entries as _, index}
			{@render entry(index)}
		{/each}
		<div class="flex gap-1">
			<Button shape="rounded" variant="submit" filled fullWidth onclick={() => addEntry(0)}>
				<span class="font-bold">Monday</span>
			</Button>
			<Button shape="rounded" variant="submit" filled fullWidth onclick={() => addEntry(1)}>
				<span class="font-bold">Tuesday</span>
			</Button>
			<Button shape="rounded" variant="submit" filled fullWidth onclick={() => addEntry(2)}>
				<span class="font-bold">Wednesday</span>
			</Button>
			<Button shape="rounded" variant="submit" filled fullWidth onclick={() => addEntry(3)}>
				<span class="font-bold">Thursday</span>
			</Button>
			<Button shape="rounded" variant="submit" filled fullWidth onclick={() => addEntry(4)}>
				<span class="font-bold">Friday</span>
			</Button>
			<Button shape="rounded" variant="submit" filled fullWidth onclick={() => addEntry(5)}>
				<span class="font-bold">Saturday</span>
			</Button>
			<Button shape="rounded" variant="submit" filled fullWidth onclick={() => addEntry(6)}>
				<span class="font-bold">Sunday</span>
			</Button>
			<Button
				shape="rounded"
				variant="danger"
				filled
				fullWidth
				onclick={() => {
					$form.entries = $form.entries.slice(0, -1);
				}}
			>
				<Minus />
			</Button>
		</div>
		<Button
			type="submit"
			variant="submit"
			shape="rounded"
			filled
			fullWidth
			appendClass="col-span-3"
		>
			<span class="font-bold">Submit</span>
		</Button>
	</form>
</div>
