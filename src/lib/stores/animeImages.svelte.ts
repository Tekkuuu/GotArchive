import { z } from 'zod/v4';
import { localStore } from './localStore.svelte';
import { anilistServices as s, extractId } from '$lib/anilist/';

/** Checks dotted path. */
function hasPath(obj: unknown, path: string): boolean {
	let current: unknown = obj;
	for (const key of path.split('.')) {
		if (current === null || typeof current !== 'object' || !(key in current)) {
			return false;
		}
		current = (current as Record<string, unknown>)[key];
	}
	return true;
}

type AnimeImageData = Awaited<ReturnType<typeof s.fetchAnimeImages>>;
type AnimeImageStore = ReturnType<typeof localStore<AnimeImageData>>;

let store: AnimeImageStore | undefined;

const updateSchema = z.union([
	z.array(z.url({ hostname: /^anilist\.co/ })).nonempty(),
	z.array(z.number().int().positive()).nonempty()
]);

export function getAnimeImagesStore(): AnimeImageStore {
	if (!store) {
		store = localStore<AnimeImageData>('animeImages', []);
	}
	return store;
}

export async function updateAnimeImagesStore(data?: string[] | number[]) {
	const localStore = getAnimeImagesStore();
	const now = new Date();
	const existingImages = localStore.value;
	const existingImageIds = new Set(existingImages.map((img) => img.id));

	const REQUIRED_IMAGE_PATHS = [
		'id',
		'coverImage.extraLarge',
		'coverImage.medium',
		'bannerImage',
		'expDate'
	];

	const expiredOrIncompleteIds = existingImages
		.filter((img) => img.expDate < now || !REQUIRED_IMAGE_PATHS.every((path) => hasPath(img, path)))
		.map((img) => img.id);

	let newIdsToFetch: number[] = [];
	if (data) {
		const validated = updateSchema.safeParse(data);
		if (validated.success) {
			const potentialIds = validated.data.map((item) =>
				typeof item === 'string' ? extractId(item) : item
			);
			const validNewIds = potentialIds.filter((id): id is number => id !== null);

			newIdsToFetch = validNewIds.filter((id) => !existingImageIds.has(id));
		}
	}

	const allIdsToFetch = Array.from(new Set([...expiredOrIncompleteIds, ...newIdsToFetch]));

	if (allIdsToFetch.length === 0) {
		return;
	}

	const chunks: number[][] = [];
	for (let i = 0; i < allIdsToFetch.length; i += 50) {
		chunks.push(allIdsToFetch.slice(i, i + 50));
	}

	const imagesChunkResult = await Promise.all(chunks.map((chunk) => s.fetchAnimeImages(chunk)));

	const fetchedImages = imagesChunkResult.flat();

	localStore.update((currentImages) => {
		const fetchedImageIds = new Set(fetchedImages.map((img) => img.id));
		const upToDateImages = currentImages.filter((img) => !fetchedImageIds.has(img.id));
		return [...upToDateImages, ...fetchedImages];
	});
}
