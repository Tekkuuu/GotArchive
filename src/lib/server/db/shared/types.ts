import * as schema from './schema';
import type { SQL } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type IdConfig<TId> = {
  validator: (id: TId | TId[]) => TId | TId[];
  where: (id: TId | TId[]) => SQL<unknown> | undefined;
}

// Accepts both tx and db (for selects)
export type DBLike = PgTransaction<any, any, any> | PostgresJsDatabase<any>;

export type ServiceMethods<TInsert, TSelect, TId> = {
  insert: (tx: PgTransaction<any, any, any>, data: TInsert | TInsert[]) => Promise<TSelect[]>;
  select: (conn: DBLike, where?: SQL<unknown> | undefined) => Promise<TSelect[]>;
  update: (tx: PgTransaction<any, any, any>, data: Partial<TInsert> | Partial<TInsert>[], id: TId | TId[]) => Promise<TSelect[]>;
  delete: (tx: PgTransaction<any, any, any>, id: TId | TId[]) => Promise<TSelect[]>;
}

export type Anime = typeof schema.anime.$inferSelect;
export type AnimeInsert = typeof schema.anime.$inferInsert;
export type AnimeEpisode = typeof schema.animeEpisode.$inferSelect;
export type AnimeEpisodeInsert = typeof schema.animeEpisode.$inferInsert;
export type AnimeGenre = typeof schema.animeGenre.$inferSelect;
export type AnimeGenreInsert = typeof schema.animeGenre.$inferInsert;
export type AnimeLink = typeof schema.animeLink.$inferSelect;
export type AnimeLinkInsert = typeof schema.animeLink.$inferInsert;
export type AnimeSeason = typeof schema.animeSeason.$inferSelect;
export type AnimeSeasonInsert = typeof schema.animeSeason.$inferInsert;
export type AnimeSeasonStatus = typeof schema.animeSeasonStatus.$inferSelect;
export type AnimeSeasonStatusInsert = typeof schema.animeSeasonStatus.$inferInsert;
export type AnimeSeasonStatusView = typeof schema.animeSeasonStatusView.$inferSelect;
export type EpisodeLink = typeof schema.episodeLink.$inferSelect;
export type EpisodeLinkInsert = typeof schema.episodeLink.$inferInsert;
export type Genre = typeof schema.genre.$inferSelect;
export type GenreInsert = typeof schema.genre.$inferInsert;
export type Platform = typeof schema.platform.$inferSelect;
export type PlatformInsert = typeof schema.platform.$inferInsert;
export type Schedule = typeof schema.schedule.$inferSelect;
export type ScheduleInsert = typeof schema.schedule.$inferInsert;
export type ScheduleAnimeDetail = typeof schema.scheduleAnimeDetail.$inferSelect;
export type ScheduleAnimeDetailInsert = typeof schema.scheduleAnimeDetail.$inferInsert;
export type ScheduleAnimeEpisode = typeof schema.scheduleAnimeEpisode.$inferSelect;
export type ScheduleAnimeEpisodeInsert = typeof schema.scheduleAnimeEpisode.$inferInsert;
export type ScheduleEntry = typeof schema.scheduleEntry.$inferSelect;
export type ScheduleEntryInsert = typeof schema.scheduleEntry.$inferInsert;
export type Changelog = typeof schema.changelog.$inferSelect;
export type ChangelogInsert = typeof schema.changelog.$inferInsert;
export type Feedback = typeof schema.feedback.$inferSelect;
export type FeedbackInsert = typeof schema.feedback.$inferInsert;
