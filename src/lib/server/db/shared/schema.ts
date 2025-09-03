import {
  pgPolicy, pgTable,
  primaryKey, foreignKey, pgEnum,
  serial, uuid, text, integer, smallint, varchar, date, time, check, unique, boolean, pgView, timestamp
} from 'drizzle-orm/pg-core';
import { authUid, authUsers, authenticatedRole } from 'drizzle-orm/supabase';
import { sql } from 'drizzle-orm';

// Custom types
export const typeSeason = pgEnum('typeSeason', ['WINTER', 'SPRING', 'SUMMER', 'FALL']);
export const typeFormat = pgEnum('typeFormat', ['TV', 'TV_SHORT', 'MOVIE', 'SPECIAL', 'OVA', 'ONA', 'MUSIC']);
export const typeScheduleEntry = pgEnum('typeScheduleEntry', ['anime', 'hololive', 'game', 'event', 'sponsored', 'misc']);
export const typeAnimeSeasonStatus = pgEnum('typeSeasonStatus', ['On hold', 'Dropped']);
export const typeUserRole = pgEnum('typeUserRole', ['user', 'admin']);
export const typeFeedbackTags = pgEnum('typeFeedbackTags', ['bug', 'feature request', 'question', 'other'])
export const typeFeedbackStatus = pgEnum('typeFeedbackStatus', ['open', 'inprogress', 'closed', 'wontfix']);

// Policies
const adminCRUD = (name: string) => pgPolicy(name, {
  as: 'permissive',
  for: 'all',
  to: 'authenticated',
  using: sql`(
    EXISTS (
      SELECT 1 FROM ${users}
      WHERE ${users.supabaseId} = ${authUid} AND ${users.role} = 'admin'
    )
  )`,
  withCheck: sql`(
    EXISTS (
      SELECT 1 FROM ${users}
      WHERE ${users.supabaseId} = ${authUid} AND ${users.role} = 'admin'
    )
  )`
})

const anyoneSelect = (name: string) => pgPolicy(name, {
  as: 'permissive',
  for: 'select',
  to: 'public',
  using: sql`true`
});

export const genre = pgTable('genre', {
  genreId: serial('genre_id').primaryKey(),
  name: varchar('name').notNull().unique(),
}, (table) => [
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const platform = pgTable('platform', {
  platformId: serial('platform_id').primaryKey(),
  name: varchar('name').notNull(),
  url: varchar('url').notNull(),
}, (table) => [
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const anime = pgTable('anime', {
  animeId: serial('anime_id').primaryKey(),
  titleNative: varchar('title_native').notNull(),
  titleRomaji: varchar('title_romaji'),
  titleEnglish: varchar('title_english'),
}, (table) => [
  unique('anime_titles_unique').on(table.titleNative, table.titleRomaji, table.titleEnglish),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const animeSeason = pgTable('anime_season', {
  animeId: integer('anime_id').notNull(),
  sequence: smallint('sequence').notNull(),
  format: typeFormat('format').notNull(),
  titleNative: varchar('title_native').notNull(),
  titleRomaji: varchar('title_romaji'),
  titleEnglish: varchar('title_english'),
  season: typeSeason('season'),
  year: smallint('year'),
  episodes: integer('episodes'),
  anilistLink: varchar('anilist_link').notNull(),
}, (table) => [
  primaryKey({ columns: [table.animeId, table.sequence] }),
  foreignKey({
    name: 'anime_fk',
    columns: [table.animeId],
    foreignColumns: [anime.animeId]
  })
    .onDelete('cascade'),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const animeSeasonStatus = pgTable('anime_season_status', {
  animeId: integer('anime_id').notNull(),
  sequence: integer('sequence').notNull(),
  status: typeAnimeSeasonStatus('status').notNull(),
}, (table) => [
  primaryKey({ columns: [table.animeId, table.sequence] }),
  foreignKey({
    name: "anime_season_fk",
    columns: [table.animeId, table.sequence],
    foreignColumns: [animeSeason.animeId, animeSeason.sequence]
  })
    .onDelete('cascade'),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
])

export const animeEpisode = pgTable('anime_episode', {
  animeEpisodeId: serial('anime_episode_id').primaryKey(),
  animeId: integer('anime_id').notNull(),
  sequence: smallint('sequence').notNull(),
  episodeNumber: smallint('episode_number').notNull(),
  watched: boolean('watched').default(false).notNull(),
}, (table) => [
  foreignKey({
    name: 'anime_season_fk',
    columns: [table.animeId, table.sequence],
    foreignColumns: [animeSeason.animeId, animeSeason.sequence]
  })
    .onDelete('cascade'),
  unique('unique_anime_season_episode').on(table.animeId, table.sequence, table.episodeNumber),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const animeGenre = pgTable('anime_genre', {
  animeId: integer('anime_id').notNull(),
  genreId: integer('genre_id').notNull(),
}, (table) => [
  primaryKey({ columns: [table.animeId, table.genreId] }),
  foreignKey({
    name: 'anime_fk',
    columns: [table.animeId],
    foreignColumns: [anime.animeId],
  })
    .onDelete('cascade'),
  foreignKey({
    name: 'genre_fk',
    columns: [table.genreId],
    foreignColumns: [genre.genreId]
  })
    .onDelete('cascade'),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const animeLink = pgTable('anime_link', {
  animeId: integer('anime_id').notNull(),
  url: varchar('url').notNull(),
  platformId: integer('platform_id').notNull(),
  note: text('note')
}, (table) => [
  primaryKey({ columns: [table.animeId, table.url] }),
  foreignKey({
    name: 'anime_fk',
    columns: [table.animeId],
    foreignColumns: [anime.animeId]
  })
    .onDelete('cascade'),
  foreignKey({
    name: 'platform_fk',
    columns: [table.platformId],
    foreignColumns: [platform.platformId]
  })
    .onDelete('restrict'),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const schedule = pgTable('schedule', {
  scheduleId: serial('schedule_id').primaryKey(),
  year: smallint('year').notNull(),
  week: smallint('week').notNull(),
  note: text('note'),
  preview: boolean('preview').notNull().default(false),
}, (table) => [
  unique('unique_year_week').on(table.year, table.week),
  check('check_week_range', sql`${table.week} BETWEEN 1 AND 53`),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const scheduleEntry = pgTable('schedule_entry', {
  scheduleEntryId: serial('schedule_entry_id').primaryKey(),
  scheduleId: integer('schedule_id').notNull(),
  type: typeScheduleEntry('type').notNull(),
  date: date('date').notNull(),
  time: time('time'),
  note: text('note'),
}, (table) => [
  foreignKey({
    name: 'schedule_fk',
    columns: [table.scheduleId],
    foreignColumns: [schedule.scheduleId],
  })
    .onDelete('cascade'),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const scheduleEntryPlatform = pgTable('schedule_entry_platform', {
  scheduleEntryId: integer('schedule_entry_id').notNull(),
  platformId: integer('platform_id').notNull(),
}, (table) => [
  primaryKey({ columns: [table.scheduleEntryId, table.platformId] }),
  foreignKey({
    name: 'schedule_entry_fk',
    columns: [table.scheduleEntryId],
    foreignColumns: [scheduleEntry.scheduleEntryId],
  })
    .onDelete('cascade'),
  foreignKey({
    name: 'platform_fk',
    columns: [table.platformId],
    foreignColumns: [platform.platformId],
  }),
  adminCRUD('Enable CRUD for admin user'),
]);

export const scheduleAnimeDetail = pgTable('schedule_anime_detail', {
  scheduleAnimeDetailId: serial('schedule_anime_detail_id').primaryKey(),
  scheduleEntryId: integer('schedule_entry_id').notNull(),
  watchedAfter: timestamp('watched_after', { withTimezone: true }).notNull(),
}, (table) => [
  foreignKey({
    name: 'schedule_entry_fk',
    columns: [table.scheduleEntryId],
    foreignColumns: [scheduleEntry.scheduleEntryId]
  })
    .onDelete('cascade'),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const scheduleAnimeEpisode = pgTable('schedule_anime_episode', {
  scheduleAnimeDetailId: integer('schedule_anime_detail_id').notNull(),
  animeEpisodeId: integer('anime_episode_id').notNull(),
}, (table) => [
  primaryKey({ columns: [table.scheduleAnimeDetailId, table.animeEpisodeId] }),
  foreignKey({
    name: 'schedule_anime_detail_fk',
    columns: [table.scheduleAnimeDetailId],
    foreignColumns: [scheduleAnimeDetail.scheduleAnimeDetailId],
  })
    .onDelete('cascade'),
  foreignKey({
    name: 'anime_episode_fk',
    columns: [table.animeEpisodeId],
    foreignColumns: [animeEpisode.animeEpisodeId],
  }).onDelete('cascade'),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const episodeLink = pgTable('episode_link', {
  animeEpisodeId: integer('anime_episode_id').notNull(),
  url: varchar('url').notNull(),
  platformId: integer('platform_id').notNull(),
  note: text('note'),
}, (table) => [
  primaryKey({ columns: [table.animeEpisodeId, table.url] }),
  foreignKey({
    name: 'anime_episode_fk',
    columns: [table.animeEpisodeId],
    foreignColumns: [animeEpisode.animeEpisodeId]
  })
    .onDelete('cascade'),
  foreignKey({
    name: 'platform_fk',
    columns: [table.platformId],
    foreignColumns: [platform.platformId]
  })
    .onDelete('restrict'),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);

export const animeSeasonStatusView = pgView('anime_season_status_view', {
  animeId: integer('anime_id').notNull(),
  sequence: integer('sequence').notNull(),
  status: varchar('status').notNull(),
})
  .with({ securityInvoker: true })
  .as(sql`
  SELECT
  s.anime_id,
  s.sequence,
  COALESCE(
    m.status::text,
    CASE
      WHEN COUNT(e.*) FILTER (WHERE e.watched) = 0
        THEN 'Planned'
      WHEN COUNT(e.*) FILTER (WHERE e.watched) = COUNT(e.*)
        THEN 'Completed'
      ELSE 'Watching'
    END
  ) AS status
  FROM anime_season AS s
  LEFT JOIN anime_season_status AS m
    ON m.anime_id = s.anime_id
  AND m.sequence = s.sequence
  LEFT JOIN anime_episode AS e
    ON e.anime_id        = s.anime_id
  AND e.sequence = s.sequence
  GROUP BY s.anime_id, s.sequence, m.status
`);

export const changelog = pgTable('changelog', {
  changelogId: serial('changelog_id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  author: text('author')
}, (table) => [
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
])

export const feedback = pgTable('feedback', {
  feedbackId: serial('feedback_id').primaryKey(),
  text: varchar('text', { length: 1000 }).notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  tag: typeFeedbackTags('tag').default('other').notNull(),
  status: typeFeedbackStatus('status').default('open').notNull(),
  contact_info: varchar('contact_info', { length: 200 }),
}, (table) => [
  pgPolicy('Enable insert for any user', {
    as: 'permissive',
    for: 'insert',
    to: 'public',
  }),
  pgPolicy('Enable select for admin user', {
    as: 'permissive',
    for: 'select',
    to: authenticatedRole,
    using: sql`EXISTS (SELECT 1 FROM ${users} WHERE ${users.supabaseId}=${authUid} AND ${users.role}='admin')`
  }),
  pgPolicy('Enable delete for admin user', {
    as: 'permissive',
    for: 'delete',
    to: authenticatedRole,
    using: sql`EXISTS (SELECT 1 FROM ${users} WHERE ${users.supabaseId}=${authUid} AND ${users.role}='admin')`
  })
]);

export const users = pgTable('users', {
  userId: serial('user_id').primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  supabaseId: uuid('supabase_id').unique(),
  role: typeUserRole('role').notNull().default('user'),
}, (table) => [
  foreignKey({
    name: 'users_supabase_fk',
    columns: [table.supabaseId],
    foreignColumns: [authUsers.id]
  }),
  pgPolicy('Enable users to view their own data only', {
    as: 'permissive',
    for: 'select',
    to: authenticatedRole,
    using: sql`${authUid}=${table.supabaseId}`
  })
]);

export const dailyUsers = pgTable('daily_users', {
  date: date('date').primaryKey(),
  count: integer('count').notNull(),
}, (table) => [
  adminCRUD('Enable CRUD for admin user'),
]);

export const scheduleMiscDetail = pgTable('schedule_misc_detail', {
  scheduleMiscDetailId: serial('schedule_misc_detail_id').primaryKey(),
  scheduleEntryId: integer('schedule_entry_id').notNull(),
  title: varchar('title').notNull(),
  description: text('description'),
}, (table) => [
  foreignKey({
    name: 'schedule_entry_fk',
    columns: [table.scheduleEntryId],
    foreignColumns: [scheduleEntry.scheduleEntryId]
  })
    .onDelete('cascade'),
  adminCRUD('Enable CRUD for admin user'),
  anyoneSelect('Enable select for any user'),
]);
