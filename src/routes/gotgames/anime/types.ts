import type { AnimeSeason } from '$lib/server/db';

export type AnimeCard = {
	animeId: string;
	titleNative: string;
	titleRomaji: string | null;
	titleEnglish: string | null;
	genres: Array<string>;
	links: Array<[string, string | null]>;
	totalEpisodes: number | null;
	totalEpisodesWatched: number | null;
	external: {
		anilistId: number | null;
		malId: number | null;
	};
};

export type SeasonData = AnimeSeason & { watchedInSeason: number; status: string };
