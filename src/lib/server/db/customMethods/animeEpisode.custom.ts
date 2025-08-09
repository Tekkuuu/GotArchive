import * as schema from '../shared/schema';
import { eq, and } from 'drizzle-orm';
import type { DBLike } from '../shared/types';
import { ServiceError, ERROR_CODES } from '$lib/errors';
import type { AnimeEpisodeDetails } from './types';

export async function selectAnimeEpisodeDetails(
  conn: DBLike,
  animeId?: number,
  sequence?: number
): Promise<AnimeEpisodeDetails[]> {
  if (animeId === undefined && sequence === undefined) {
    throw new ServiceError(ERROR_CODES.validation.SELECT_EMPTY_ARGS);
  }

  let query = conn
    .select({
      animeEpisodeId: schema.animeEpisode.animeEpisodeId,
      episodeNumber: schema.animeEpisode.episodeNumber,
      animeId: schema.animeEpisode.animeId,
      titleNative: schema.animeSeason.titleNative,
      titleRomaji: schema.animeSeason.titleRomaji,
      titleEnglish: schema.animeSeason.titleEnglish,
    })
    .from(schema.animeEpisode)
    .innerJoin(
      schema.animeSeason,
      and(
        eq(schema.animeEpisode.animeId, schema.animeSeason.animeId),
        eq(schema.animeEpisode.sequence, schema.animeSeason.sequence)
      )
    );

  if (animeId !== undefined && sequence === undefined) {
    query.where(eq(schema.animeEpisode.animeId, animeId));
  } else if (sequence !== undefined && animeId === undefined) {
    query.where(eq(schema.animeEpisode.sequence, sequence));
  } else if (sequence !== undefined && animeId !== undefined) {
    query.where(
      and(
        eq(schema.animeEpisode.animeId, animeId),
        eq(schema.animeEpisode.sequence, sequence)
      )
    );
  }

  query.orderBy(
    schema.animeEpisode.animeId,
    schema.animeEpisode.sequence,
    schema.animeEpisode.episodeNumber
  );

  return await query as AnimeEpisodeDetails[];
}
