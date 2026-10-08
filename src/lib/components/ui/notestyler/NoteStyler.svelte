<script lang="ts">
	import { ChevronRight, Copy, Palette, Plus, X } from 'lucide-svelte';
	import { tick, untrack } from 'svelte';
	import NotePreview from '$lib/components/ui/notestyler/NotePreview.svelte';
	import { bbcodeToHtml } from '$lib/util/bbcode';
	import { slide } from 'svelte/transition';
	import { sineInOut } from 'svelte/easing';
	import { getLatestNote } from '$lib/remote/schedule.remote';

	interface Props {
		content: string;
		week: number;
		year: number;
	}

	let { content = $bindable(), week, year }: Props = $props();

	let lines = $state<string[]>((content ?? '').split('\n'));

	const previewHtml = $derived(bbcodeToHtml(content));

	$effect(() => {
		const incoming = content ?? '';
		if (untrack(() => lines.join('\n')) !== incoming) {
			lines = incoming.split('\n');
		}
	});

	let activeIndex = $state<number | null>(null);
	let activeInput: HTMLInputElement | null = null;
	let colorInput = $state<HTMLInputElement | null>(null);
	let selectionStart = 0;
	let selectionEnd = 0;

	let editorOpen = $state(true);
	let previewOpen = $state(false);

	function toggleEditor() {
		editorOpen = !editorOpen;
		if (!editorOpen) {
			activeIndex = null;
			activeInput = null;
		}
	}

	function togglePreview() {
		previewOpen = !previewOpen;
	}

	function rememberSelection(index: number, event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		activeIndex = index;
		activeInput = input;
		selectionStart = input.selectionStart ?? input.value.length;
		selectionEnd = input.selectionEnd ?? selectionStart;
	}

	function sync() {
		content = lines.join('\n');
	}

	function addLine() {
		lines = [...lines, ''];
		sync();
	}

	function removeLine(index: number) {
		lines = lines.filter((_, i) => i !== index);
		sync();
	}

	function updateLine(index: number, value: string) {
		lines[index] = value;
		sync();
	}

	async function applyColor(color: string) {
		if (activeIndex === null) return;

		const index = activeIndex;
		const line = lines[index] ?? '';
		const start = Math.min(selectionStart, line.length);
		const end = Math.min(Math.max(selectionEnd, start), line.length);
		const selected = line.slice(start, end);
		const open = `[color=${color}]`;
		const close = '[/color]';

		updateLine(index, `${line.slice(0, start)}${open}${selected}${close}${line.slice(end)}`);

		await tick();
		if (activeInput) {
			activeInput.focus();
			const cursor = start + open.length + selected.length + close.length;
			activeInput.setSelectionRange(cursor, cursor);
		}
	}

	async function copyLatest() {
		const latest = await getLatestNote({ week, year });
		if (latest.note) {
			content = latest.note;
		}
	}
</script>

<div class="flex w-full flex-col gap-2">
	<div class="flex flex-wrap items-center justify-between gap-2">
		<button
			type="button"
			class="flex items-center gap-2 text-sm font-semibold"
			onclick={toggleEditor}
			aria-expanded={editorOpen}
		>
			<ChevronRight class="size-5 transition-transform {editorOpen ? 'rotate-90' : ''}" />
			Contents
		</button>
		{#if editorOpen}
			<div
				class="flex items-center gap-2"
				transition:slide={{ axis: 'y', easing: sineInOut, duration: 100 }}
			>
				<button
					type="button"
					class="btn btn-primary btn-xs"
					disabled={activeIndex === null}
					onclick={() => colorInput?.click()}
				>
					<Palette class="size-4" />
					Color
				</button>
				<input
					type="color"
					class="hidden"
					bind:this={colorInput}
					onchange={(e) => applyColor(e.currentTarget.value)}
				/>
				<button type="button" class="btn btn-primary btn-xs" onclick={addLine}>
					<Plus class="size-4" />
					Add line
				</button>
				<button type="button" class="btn btn-primary btn-xs" onclick={copyLatest}>
					<Copy class="size-4" />
					Copy latest
				</button>
			</div>
		{/if}
	</div>

	{#if editorOpen}
		<div
			class="rounded-box border-base-content/20 divide-base-content/10 flex w-full flex-col divide-y overflow-hidden border"
			transition:slide={{ axis: 'y', easing: sineInOut, duration: 100 }}
		>
			{#each lines as line, i}
				<div class="grid w-full grid-cols-[3rem_1fr_auto] items-stretch">
					<div
						class="text-base-content/50 bg-base-200 flex w-full items-center justify-end px-2 font-mono text-sm"
					>
						<span>{i + 1}</span>
					</div>
					<input
						type="text"
						value={line}
						oninput={(e) => {
							updateLine(i, e.currentTarget.value);
							rememberSelection(i, e);
						}}
						onfocus={(e) => rememberSelection(i, e)}
						onclick={(e) => rememberSelection(i, e)}
						onkeyup={(e) => rememberSelection(i, e)}
						onselect={(e) => rememberSelection(i, e)}
						class="bg-base-100 w-full p-1.5 font-mono text-sm outline-0"
					/>
					<button
						type="button"
						class="bg-base-100 hover:bg-error/50 flex aspect-square h-full w-full items-center justify-center"
						onclick={() => removeLine(i)}
						aria-label={`Remove line ${i + 1}`}
					>
						<X class="size-4" />
					</button>
				</div>
			{/each}

			{#if lines.length === 0}
				<p class="text-base-content/40 bg-base-100 p-3 text-center text-sm italic">Empty notes</p>
			{/if}
		</div>
	{/if}

	<div class="flex flex-col gap-2">
		<button
			type="button"
			class="text-base-content flex items-center gap-2 font-bold"
			onclick={togglePreview}
			aria-expanded={previewOpen}
		>
			<ChevronRight class="size-5 transition-transform {previewOpen ? 'rotate-90' : ''}" />
			Preview
		</button>
		{#if previewOpen}
			<div
				class="rounded-box bg-base-300 p-2"
				transition:slide={{ axis: 'y', easing: sineInOut, duration: 100 }}
			>
				<NotePreview html={previewHtml} />
			</div>
		{/if}
	</div>
</div>
