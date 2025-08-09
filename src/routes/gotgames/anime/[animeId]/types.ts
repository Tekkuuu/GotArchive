import type { AnimeSeason } from "$lib/server/db";

export type AnimeCard = {
  animeId: number;
  titleNative: string;
  titleRomaji: string | null;
  titleEnglish: string | null;
  genres: Array<string>;
  links: Array<string>;
}

export type SeasonData = AnimeSeason & { watchedInSeason: number, status: string } 
