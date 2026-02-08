import * as schema from './schema';

// Table type exports for convenient use throughout the app
export type Anime = typeof schema.anime.$inferSelect;
export type AnimeInsert = typeof schema.anime.$inferInsert;

export type AnimeGenre = typeof schema.animeGenre.$inferSelect;
export type AnimeGenreInsert = typeof schema.animeGenre.$inferInsert;

export type AnimeLink = typeof schema.animeLink.$inferSelect;
export type AnimeLinkInsert = typeof schema.animeLink.$inferInsert;

export type AnimeSeason = typeof schema.animeSeason.$inferSelect;
export type AnimeSeasonInsert = typeof schema.animeSeason.$inferInsert;

export type AnimeSeasonMetadata = typeof schema.animeSeasonMetadata.$inferSelect;
export type AnimeSeasonMetadataInsert = typeof schema.animeSeasonMetadata.$inferInsert;

export type Genre = typeof schema.genre.$inferSelect;
export type GenreInsert = typeof schema.genre.$inferInsert;

export type Platform = typeof schema.platform.$inferSelect;
export type PlatformInsert = typeof schema.platform.$inferInsert;

export type Schedule = typeof schema.schedule.$inferSelect;
export type ScheduleInsert = typeof schema.schedule.$inferInsert;

export type ScheduleEntry = typeof schema.scheduleEntry.$inferSelect;
export type ScheduleEntryInsert = typeof schema.scheduleEntry.$inferInsert;

export type ScheduleEntryPlatform = typeof schema.scheduleEntryPlatform.$inferSelect;
export type ScheduleEntryPlatformInsert = typeof schema.scheduleEntryPlatform.$inferInsert;

export type ScheduleSlot = typeof schema.scheduleSlot.$inferSelect;
export type ScheduleSlotInsert = typeof schema.scheduleSlot.$inferInsert;

export type ScheduleSlotPlatform = typeof schema.scheduleSlotPlatform.$inferSelect;
export type ScheduleSlotPlatformInsert = typeof schema.scheduleSlotPlatform.$inferInsert;

export type ScheduleEntrySlot = typeof schema.scheduleEntrySlot.$inferSelect;
export type ScheduleEntrySlotInsert = typeof schema.scheduleEntrySlot.$inferInsert;
