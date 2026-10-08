<script lang="ts">
	import emblaCarouselSvelte from 'embla-carousel-svelte';
	import Autoplay from 'embla-carousel-autoplay';
	import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
	import { ChevronLeft, ChevronRight } from 'lucide-svelte';
	import { getAnimeImagesStore } from '$lib/stores/';

	export interface WatchingEntry {
		animeSeasonId: string;
		animeId: string;
		titles: {
			native: string;
			romaji: string | null;
			english: string | null;
		};
		anilistId: number | null;
		malId: number | null;
		episodes: number[];
	}

	interface Props {
		watching: WatchingEntry[];
	}

	let { watching }: Props = $props();
	let images = getAnimeImagesStore();

	let emblaApi = $state<EmblaCarouselType | undefined>(undefined);
	let selectedIndex = $state(0);

	const options: EmblaOptionsType = { loop: true, align: 'center', dragFree: true };
	const plugins = [Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })];

	/** Neighbours settle at 1 - TWEEN_SCALE_DOWN; center stays at 1. */
	const TWEEN_SCALE_DOWN = 0.15;
	let tweenNodes: Array<HTMLElement | null> = [];

	function numberWithinRange(value: number, min: number, max: number): number {
		return Math.min(Math.max(value, min), max);
	}

	function setTweenNodes(api: EmblaCarouselType) {
		tweenNodes = api
			.slideNodes()
			.map((slideNode) => slideNode.querySelector<HTMLElement>('.embla__scale'));
	}

	function tweenScale(api: EmblaCarouselType, eventName?: string) {
		const engine = api.internalEngine();
		const scrollProgress = api.scrollProgress();
		const slidesInView = api.slidesInView();
		const isScrollEvent = eventName === 'scroll';
		const snapList = api.scrollSnapList();
		const snapGap = snapList.length > 1 ? 1 / (snapList.length - 1) : 1;

		snapList.forEach((scrollSnap, snapIndex) => {
			let diffToTarget = scrollSnap - scrollProgress;
			const slidesInSnap = engine.slideRegistry[snapIndex] ?? [];

			slidesInSnap.forEach((slideIndex) => {
				if (isScrollEvent && !slidesInView.includes(slideIndex)) return;

				if (engine.options.loop) {
					engine.slideLooper.loopPoints.forEach((loopItem) => {
						const target = loopItem.target();
						if (slideIndex === loopItem.index && target !== 0) {
							const sign = Math.sign(target);
							if (sign === -1) diffToTarget = scrollSnap - (1 + scrollProgress);
							if (sign === 1) diffToTarget = scrollSnap + (1 - scrollProgress);
						}
					});
				}

				const tweenValue = 1 - (Math.abs(diffToTarget) / snapGap) * TWEEN_SCALE_DOWN;
				const scale = numberWithinRange(tweenValue, 0, 1).toFixed(3);
				tweenNodes[slideIndex]?.style.setProperty('transform', `scale(${scale})`);
			});
		});
	}

	function handleInit(event: CustomEvent<EmblaCarouselType>) {
		emblaApi = event.detail;
		setTweenNodes(emblaApi);
		tweenScale(emblaApi);
		emblaApi.on('reInit', (api) => {
			setTweenNodes(api);
			tweenScale(api);
		});
		emblaApi.on('scroll', tweenScale);
		emblaApi.on('slideFocus', tweenScale);
		emblaApi.on('select', handleSelect);
		handleSelect();
	}

	function handleSelect() {
		if (emblaApi) selectedIndex = emblaApi.selectedScrollSnap();
	}

	function scrollTo(index: number) {
		emblaApi?.scrollTo(index);
	}
</script>

{#snippet card(entry: WatchingEntry)}
	{@const anilistId = entry.anilistId}
	{@const src =
		images.value.find((i) => i.id === anilistId)?.coverImage.extraLarge ??
		images.value.find((i) => i.id === anilistId)?.coverImage.medium}
	<a
		href="/gotgames/anime/{entry.animeId}"
		class="card bg-base-300 w-68 shadow-sm transition-all duration-150 hover:scale-[102%]"
	>
		{#if src && anilistId}
			<figure>
				<img
					loading="lazy"
					decoding="async"
					{src}
					alt={entry.titles.english ?? entry.titles.romaji ?? entry.titles.native}
					class="block aspect-3/4 w-68 object-cover"
				/>
			</figure>
		{:else}
			<div class="skeleton block aspect-3/4 h-88 w-68 rounded-lg object-cover"></div>
		{/if}
		<div class="card-body h-40 items-center text-center">
			<div class="card-title">
				{entry.titles.english ?? entry.titles.romaji ?? entry.titles.native}
			</div>
			<p>
				Episodes:
				<br />
				{entry.episodes.join(', ')}
			</p>
		</div>
	</a>
{/snippet}

{#if watching.length === 0}
	<p class="text-base-content/60 py-8 text-center">Nothing scheduled this week.</p>
{:else if watching.length < 3}
	<div class="flex w-full items-center justify-center max-sm:flex-col">
		{#each watching as entry (entry.animeSeasonId)}
			<div class="flex justify-center px-2 py-2">
				{@render card(entry)}
			</div>
		{/each}
	</div>
{:else}
	<div
		class="mx-auto flex w-full max-w-4xl items-center gap-1"
		role="region"
		aria-roledescription="carousel"
		aria-label="Watching this week"
	>
		<button
			type="button"
			class="btn btn-circle btn-sm shrink-0"
			onclick={() => emblaApi?.scrollPrev()}
			aria-label="Previous slide"
		>
			<ChevronLeft class="size-4" />
		</button>

		<div
			class="embla__viewport min-w-0 flex-1"
			use:emblaCarouselSvelte={{ options, plugins }}
			onemblaInit={handleInit}
		>
			<div class="embla__container">
				{#each watching as entry, i (entry.animeSeasonId)}
					<div class="embla__slide" aria-hidden={i !== selectedIndex}>
						<div class="embla__scale flex justify-center">
							{@render card(entry)}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<button
			type="button"
			class="btn btn-circle btn-sm shrink-0"
			onclick={() => emblaApi?.scrollNext()}
			aria-label="Next slide"
		>
			<ChevronRight class="size-4" />
		</button>
	</div>

	<div class="border-neutral mt-2 flex gap-2 rounded-full border p-2">
		{#each watching as entry, i (entry.animeSeasonId)}
			{@const slideTitle =
				entry.titles.english ?? entry.titles.romaji ?? entry.titles.native ?? `slide ${i + 1}`}
			<button
				class="btn btn-circle btn-xs btn-neutral {i === selectedIndex && 'btn-primary'}"
				aria-label="Show {slideTitle}"
				aria-current={i === selectedIndex}
				onclick={() => scrollTo(i)}
			></button>
		{/each}
	</div>
{/if}

<style>
	.embla__viewport {
		overflow: hidden;
	}
	.embla__container {
		display: flex;
		touch-action: pan-y pinch-zoom;
	}
	.embla__slide {
		flex: 0 0 100%;
		min-width: 0;
		display: flex;
		justify-content: center;
		padding: 0.5rem;
	}
	@media (min-width: 640px) {
		.embla__slide {
			flex-basis: 50%;
		}
	}
	@media (min-width: 1024px) {
		.embla__slide {
			flex-basis: 33.3333%;
		}
	}
</style>
