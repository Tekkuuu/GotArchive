import { createApiMethod } from './factory';
import * as u from './util';
import * as z from 'zod';
import { AnilistError, ERROR_CODES } from '$lib/errors';
import { addDays } from 'date-fns';
import _ from 'lodash';
import type {
  Anime,
  AnimeSeason,
  AnimeSeasonBulk,
  CoverImage,
} from './types';


const fetchAnimeMethod = createApiMethod<number, Anime, { Media: Anime }>({
  query: `query ($id: Int) { Media(id: $id, type: ANIME) { id title { native romaji english } genres } }`,
  validate: (id) => {
    if (!z.number().int().positive().safeParse(id).success) {
      throw new AnilistError(ERROR_CODES.anilist.INVALID_ID);
    }
  },
  mapInputToVariables: (id) => ({ id }),
  transformResponse: (res) => res.Media,
});

const fetchAnimeSeasonBulkMethod = createApiMethod<{ mainId: number, seasonIds: number[] }[], AnimeSeasonBulk, { [key: string]: Anime | AnimeSeason }>({
  query: u.anilistAnimeSeasonBulk,
  validate: (id) => {
    const schema = z.array(
      z.object({
        mainId: z.number().int().positive(),
        seasonIds: z.array(z.number().int().positive())
      })
    );
    if (!schema.safeParse(id).success) {
      throw new AnilistError(ERROR_CODES.anilist.INVALID_ID);
    }
  },
  mapInputToVariables: () => undefined,
  transformResponse: (res) => {
    const animeEntries: Record<string, Anime> = {};
    const seasonGroups: Record<string, AnimeSeason[]> = {};

    Object.entries(res).forEach(([key, value]) => {
      const animeMatch = key.match(/^anime_(\d+)$/);
      const seasonMatch = key.match(/^anime_(\d+)_(\d+)$/);

      if (animeMatch) {
        animeEntries[animeMatch[1]] = value as Anime;
      } else if (seasonMatch) {
        const mainId = seasonMatch[1];
        if (!seasonGroups[mainId]) seasonGroups[mainId] = [];
        seasonGroups[mainId].push(value as AnimeSeason);
      }
    });

    return Object.entries(animeEntries).map(([mainId, anime]) => ({
      anime,
      seasons: seasonGroups[mainId] ?? []
    }));
  }
});

const fetchAnimeSeasonMethod = createApiMethod<number, AnimeSeason, { Media: AnimeSeason }>({
  query: `query ($id: Int) { 
    Media(id: $id, type: ANIME) { 
      id 
      title { native romaji english } 
      format 
      season 
      seasonYear 
      episodes 
      siteUrl 
    } 
  }`,
  validate: (id) => {
    if (!Number.isInteger(id) || id <= 0) throw new AnilistError(ERROR_CODES.anilist.INVALID_ID);
  },
  mapInputToVariables: (id) => ({ id }),
  transformResponse: (res) => res.Media,
});

const fetchAnimeImagesMethod = createApiMethod<number[], CoverImage[], Record<string, Omit<CoverImage, 'expDate'>>>({
  query: u.anilistImageQueryBuilder,
  validate: (ids) => {
    if (ids.some(id => !Number.isInteger(id) || id <= 0)) {
      throw new AnilistError(ERROR_CODES.anilist.INVALID_ID, { details: { reason: 'One or more IDs provided were invalid.' } });
    }
  },
  mapInputToVariables: () => undefined,
  transformResponse: (res) => {
    if (!res) return [];
    return Object.values(res).map(item => ({ ...item, expDate: addDays(new Date(), 7) }))
  },
});

export const services = {
  fetchAnime: fetchAnimeMethod,
  fetchAnimeSeasonBulk: fetchAnimeSeasonBulkMethod,
  fetchAnimeSeason: fetchAnimeSeasonMethod,
  fetchAnimeImages: fetchAnimeImagesMethod,
};
