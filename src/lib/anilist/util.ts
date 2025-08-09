import _ from 'lodash';

/**
 * Builds a GraphQL query string to fetch cover and banner images for a list of AniList media IDs.
 *
 * @param ids - An array of AniList media IDs.
 * @returns A GraphQL query string requesting the coverImage (extraLarge) and bannerImage for each media ID.
 */
export function anilistImageQueryBuilder(ids: Array<number>): string {
  const blocks = ids.map((id, i) => {
    return `cover${i}: Media(id: ${id}) { id coverImage { extraLarge } bannerImage }`
  });

  return `query { ${blocks.join(', ')} }`
}

/**
 * Generates a GraphQL query string to fetch bulk anime season data from AniList.
 * 
 * @param ids - Array of objects containing main anime IDs and their corresponding season IDs.
 * @returns A GraphQL query string for fetching anime and season details.
 */
export function anilistAnimeSeasonBulk(ids: Array<{ mainId: number, seasonIds: number[] }>): string {
  /**
   * Constructs a GraphQL block for the main anime.
   * 
   * @param id - The main anime ID.
   * @returns A GraphQL query block for the anime.
   */
  const animeBlock = (id: number) => {
    return `anime_${id}: Media(id: ${id}, type: ANIME) { id title { native romaji english } genres }`;
  }

  /**
   * Constructs a GraphQL block for a specific anime season.
   * 
   * @param mainId - The main anime ID.
   * @param id - The season anime ID.
   * @param sequence - The sequence number for the season.
   * @returns A GraphQL query block for the anime season.
   */
  const seasonBlock = (mainId: number, id: number, sequence: number) => {
    return `anime_${mainId}_${sequence}: Media(id: ${id}, type: ANIME) { id title { native romaji english } format season seasonYear episodes siteUrl }`;
  }

  return `query { ${ids.map((anime) => {
    const ab = animeBlock(anime.mainId);
    const sb = anime.seasonIds.map((id, index) => seasonBlock(anime.mainId, id, index + 1)).join(', ');
    return ab + ', ' + sb;
  }).join(', ')} }`;
}

/**
 * Extracts the first numeric ID found in a given URL string.
 *
 * @param url - The URL string to extract the ID from.
 * @returns The extracted numeric ID as a number, or null if no valid ID is found.
 */
export function extractId(url: string | null): number | null {
  if (!url) return null;

  const parts = _.compact(url.split('/'));
  const idPart = parts.find((part) => /^\d+$/.test(part));
  const id = Number(idPart);
  return Number.isFinite(id) ? id : null;
}
