export type AnimeCard = {
  animeId: number;
  titleNative: string;
  titleRomaji: string | null;
  titleEnglish: string | null;
  genres: Array<string>;
  links: Array<[string, string | null]>;
  totalEpisodes: string | null;
  totalEpisodesWatched: number;
  mainSeason: string;
}
