import { fetchGraphQL } from './client';
import * as u from './util';
import * as z from 'zod';
import { AppError, ERROR_CODES } from '$lib/errors';
import { addDays } from 'date-fns';
import type { Anime, AnimeSeason, CoverImage } from './types';

/** AniList API operations. */

export async function fetchAnime(id: number): Promise<Anime> {
	if (!z.number().int().positive().safeParse(id).success) {
		throw new AppError(ERROR_CODES.anilist.INVALID_ID);
	}

	const response = await fetchGraphQL<{ Media: Anime }>(
		`query ($id: Int) { Media(id: $id, type: ANIME) { id title { native romaji english } genres } }`,
		{ id }
	);

	return response.Media;
}

export async function fetchAnimeSeason(id: number): Promise<AnimeSeason> {
	if (!Number.isInteger(id) || id <= 0) throw new AppError(ERROR_CODES.anilist.INVALID_ID);

	const response = await fetchGraphQL<{ Media: AnimeSeason }>(
		`query ($id: Int) { 
      Media(id: $id, type: ANIME) { 
        id 
        idMal
        title { native romaji english } 
        format 
        season 
        seasonYear 
        episodes 
        siteUrl 
      } 
    }`,
		{ id }
	);

	return response.Media;
}

export async function fetchAnimeImages(ids: number[]): Promise<CoverImage[]> {
	if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
		throw new AppError(ERROR_CODES.anilist.INVALID_ID, {
			context: { reason: 'One or more IDs provided were invalid.' }
		});
	}

	const response = await fetchGraphQL<Record<string, Omit<CoverImage, 'expDate'>>>(
		u.anilistImageQueryBuilder(ids)
	);

	if (!response) return [];

	return Object.values(response).map((item) => ({ ...item, expDate: addDays(new Date(), 7) }));
}

export const services = {
	fetchAnime,
	fetchAnimeSeason,
	fetchAnimeImages
};
