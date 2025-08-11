import * as z from 'zod/v4';
import _ from 'lodash';
import { localStore } from './localStore.svelte';
import { anilistServices as s, extractId } from '$lib/anilist/';

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
  const existingImageIds = new Set(existingImages.map(img => img.id));

  const REQUIRED_IMAGE_PATHS = [
    'id',
    'coverImage.extraLarge',
    'coverImage.medium',
    'bannerImage',
    'expDate'
  ];

  const expiredOrIncompleteIds = _.map(
    _.filter(existingImages, img =>
      img.expDate < now || !_.every(REQUIRED_IMAGE_PATHS, path => _.has(img, path))
    ),
    'id'
  );

  let newIdsToFetch: number[] = [];
  if (data) {
    const validated = updateSchema.safeParse(data);
    if (validated.success) {
      const potentialIds = validated.data.map(item => (typeof item === 'string' ? extractId(item) : item));
      const validNewIds = potentialIds.filter((id): id is number => id !== null);

      newIdsToFetch = validNewIds.filter(id => !existingImageIds.has(id));
    }
  }

  const allIdsToFetch = _.uniq([...expiredOrIncompleteIds, ...newIdsToFetch]);

  if (allIdsToFetch.length === 0) {
    return;
  }

  const imagesChunkResult = await Promise.all(
    _.chunk(allIdsToFetch, 50).map(chunk => s.fetchAnimeImages(chunk))
  );

  const fetchedImages = _.flatten(imagesChunkResult);

  localStore.update(currentImages => {
    const fetchedImageIds = new Set(fetchedImages.map(img => img.id));
    const upToDateImages = currentImages.filter(img => !fetchedImageIds.has(img.id));
    return [...upToDateImages, ...fetchedImages];
  });
}
