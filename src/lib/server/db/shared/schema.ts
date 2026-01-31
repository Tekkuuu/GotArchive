import {
	pgTable,
	primaryKey,
	foreignKey,
	pgEnum,
	uuid,
	text,
	integer,
	smallint,
	varchar,
	date,
	time,
	check,
	unique,
	boolean,
	timestamp,
	pgSchema
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Custom types
export const typeSeason = pgEnum('typeSeason', ['WINTER', 'SPRING', 'SUMMER', 'FALL']);
export const typeFormat = pgEnum('typeFormat', [
	'TV',
	'TV_SHORT',
	'MOVIE',
	'SPECIAL',
	'OVA',
	'ONA',
	'MUSIC'
]);
export const typeScheduleEntry = pgEnum('typeScheduleEntry', [
	'anime',
	'hololive',
	'game',
	'event',
	'sponsored',
	'misc'
]);

// Better Auth schema and types
export const bauthSchema = pgSchema('bauth');
export const typeUserRole = pgEnum('typeUserRole', ['user', 'moderator', 'admin']);

export const genre = pgTable('genre', {
	genreId: uuid('genre_id').primaryKey().defaultRandom(),
	name: varchar('name').notNull().unique()
});

export const platform = pgTable('platform', {
	platformId: uuid('platform_id').primaryKey().defaultRandom(),
	name: varchar('name').notNull(),
	url: varchar('url').notNull()
});

export const anime = pgTable(
	'anime',
	{
		animeId: uuid('anime_id').primaryKey().defaultRandom(),
		titleNative: varchar('title_native').notNull(),
		titleRomaji: varchar('title_romaji'),
		titleEnglish: varchar('title_english'),
		logoUrl: varchar('logo_url'),
		shortTitle: varchar('short_title')
	},
	(table) => [
		unique('anime_titles_unique').on(table.titleNative, table.titleRomaji, table.titleEnglish)
	]
);

export const animeSeason = pgTable(
	'anime_season',
	{
		animeSeasonId: uuid('anime_season_id').primaryKey().defaultRandom(),
		animeId: uuid('anime_id').notNull(),
		sequence: smallint('sequence').notNull(),
		format: typeFormat('format').notNull(),
		titleNative: varchar('title_native').notNull(),
		titleRomaji: varchar('title_romaji'),
		titleEnglish: varchar('title_english'),
		shortTitle: varchar('short_title'),
		season: typeSeason('season'),
		year: smallint('year'),
		episodes: integer('episodes'),
		episodeProgress: integer('episode_progress').default(0).notNull()
	},
	(table) => [
		unique('unique_anime_season').on(table.animeId, table.sequence),
		foreignKey({
			name: 'anime_fk',
			columns: [table.animeId],
			foreignColumns: [anime.animeId]
		}).onDelete('cascade')
	]
);

export const animeGenre = pgTable(
	'anime_genre',
	{
		animeId: uuid('anime_id').notNull(),
		genreId: uuid('genre_id').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.animeId, table.genreId] }),
		foreignKey({
			name: 'anime_fk',
			columns: [table.animeId],
			foreignColumns: [anime.animeId]
		}).onDelete('cascade'),
		foreignKey({
			name: 'genre_fk',
			columns: [table.genreId],
			foreignColumns: [genre.genreId]
		}).onDelete('cascade')
	]
);

export const animeLink = pgTable(
	'anime_link',
	{
		animeId: uuid('anime_id').notNull(),
		url: varchar('url').notNull(),
		platformId: uuid('platform_id').notNull(),
		note: text('note')
	},
	(table) => [
		primaryKey({ columns: [table.animeId, table.url] }),
		foreignKey({
			name: 'anime_fk',
			columns: [table.animeId],
			foreignColumns: [anime.animeId]
		}).onDelete('cascade'),
		foreignKey({
			name: 'platform_fk',
			columns: [table.platformId],
			foreignColumns: [platform.platformId]
		}).onDelete('restrict')
	]
);

export const schedule = pgTable(
	'schedule',
	{
		scheduleId: uuid('schedule_id').primaryKey().defaultRandom(),
		year: smallint('year').notNull(),
		week: smallint('week').notNull(),
		note: text('note'),
		preview: boolean('preview').notNull().default(false)
	},
	(table) => [
		unique('unique_year_week').on(table.year, table.week),
		check('check_week_range', sql`${table.week} BETWEEN 1 AND 53`)
	]
);

export const scheduleSlot = pgTable(
	'schedule_slot',
	{
		scheduleSlotId: uuid('schedule_slot_id').primaryKey().defaultRandom(),
		dayOfWeek: smallint('day_of_week').notNull(), // 0 = Sunday, 6 = Saturday
		time: time('time'), // Optional - can be null for partial slot definitions
		type: typeScheduleEntry('type'), // Optional - can be null for partial slot definitions
		animeSeasonId: uuid('anime_season_id'), // Optional - can be null
		title: varchar('title'), // Optional - can be null for partial slot definitions
		description: text('description'), // Optional - can be null
		logoUrl: varchar('logo_url'), // Optional - can be null
		episodeCount: smallint('episode_count'), // Optional - for anime, number of episodes per stream
		cancelledText: text('cancelled_text'), // Optional - default text if slot is cancelled
		note: text('note'), // Optional - internal notes about this slot
		isActive: boolean('is_active').notNull().default(true), // To disable/enable slots
		createdAt: date('created_at')
			.notNull()
			.default(sql`CURRENT_DATE`),
		updatedAt: date('updated_at')
			.notNull()
			.default(sql`CURRENT_DATE`)
	},
	(table) => [
		foreignKey({
			name: 'anime_season_fk',
			columns: [table.animeSeasonId],
			foreignColumns: [animeSeason.animeSeasonId]
		}).onDelete('set null'),
		check('check_day_of_week_range', sql`${table.dayOfWeek} BETWEEN 0 AND 6`)
	]
);

export const scheduleEntry = pgTable(
	'schedule_entry',
	{
		scheduleEntryId: uuid('schedule_entry_id').primaryKey().defaultRandom(),
		scheduleId: uuid('schedule_id').notNull(),
		type: typeScheduleEntry('type').notNull(),
		date: date('date').notNull(),
		time: time('time'),
		note: text('note'),
		logoUrl: varchar('logo_url'),
		animeSeasonId: uuid('anime_season_id'),
		title: varchar('title'),
		description: text('description'),
		cancelledText: text('cancelled_text'), // Text to display if this entry is cancelled
		isCancelled: boolean('is_cancelled').notNull().default(false) // Whether this entry is cancelled
	},
	(table) => [
		foreignKey({
			name: 'schedule_fk',
			columns: [table.scheduleId],
			foreignColumns: [schedule.scheduleId]
		}).onDelete('cascade'),
		foreignKey({
			name: 'anime_season_fk',
			columns: [table.animeSeasonId],
			foreignColumns: [animeSeason.animeSeasonId]
		}).onDelete('set null')
	]
);

export const scheduleSlotPlatform = pgTable(
	'schedule_slot_platform',
	{
		scheduleSlotId: uuid('schedule_slot_id').notNull(),
		platformId: uuid('platform_id').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.scheduleSlotId, table.platformId] }),
		foreignKey({
			name: 'schedule_slot_fk',
			columns: [table.scheduleSlotId],
			foreignColumns: [scheduleSlot.scheduleSlotId]
		}).onDelete('cascade'),
		foreignKey({
			name: 'platform_fk',
			columns: [table.platformId],
			foreignColumns: [platform.platformId]
		})
	]
);

export const scheduleEntryPlatform = pgTable(
	'schedule_entry_platform',
	{
		scheduleEntryId: uuid('schedule_entry_id').notNull(),
		platformId: uuid('platform_id').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.scheduleEntryId, table.platformId] }),
		foreignKey({
			name: 'schedule_entry_fk',
			columns: [table.scheduleEntryId],
			foreignColumns: [scheduleEntry.scheduleEntryId]
		}).onDelete('cascade'),
		foreignKey({
			name: 'platform_fk',
			columns: [table.platformId],
			foreignColumns: [platform.platformId]
		})
	]
);

export const scheduleEntrySlot = pgTable(
	'schedule_entry_slot',
	{
		scheduleEntryId: uuid('schedule_entry_id').notNull(),
		scheduleSlotId: uuid('schedule_slot_id').notNull()
	},
	(table) => [
		primaryKey({ columns: [table.scheduleEntryId] }), // Each entry can only come from one slot
		foreignKey({
			name: 'schedule_entry_fk',
			columns: [table.scheduleEntryId],
			foreignColumns: [scheduleEntry.scheduleEntryId]
		}).onDelete('cascade'),
		foreignKey({
			name: 'schedule_slot_fk',
			columns: [table.scheduleSlotId],
			foreignColumns: [scheduleSlot.scheduleSlotId]
		}).onDelete('cascade')
	]
);

// Better Auth tables
export const bauthUser = bauthSchema.table('user', {
	id: text('id').primaryKey(),
	name: text('name').notNull(),
	email: text('email').notNull().unique(),
	emailVerified: boolean('email_verified').notNull().default(false),
	image: text('image'),
	role: typeUserRole('role').notNull().default('user'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const bauthSession = bauthSchema.table('session', {
	id: text('id').primaryKey(),
	expiresAt: timestamp('expires_at').notNull(),
	token: text('token').notNull().unique(),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	userId: text('user_id')
		.notNull()
		.references(() => bauthUser.id, { onDelete: 'cascade' })
});

export const bauthAccount = bauthSchema.table('account', {
	id: text('id').primaryKey(),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	userId: text('user_id')
		.notNull()
		.references(() => bauthUser.id, { onDelete: 'cascade' }),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	idToken: text('id_token'),
	accessTokenExpiresAt: timestamp('access_token_expires_at'),
	refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
	scope: text('scope'),
	password: text('password'),
	createdAt: timestamp('created_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const bauthVerification = bauthSchema.table('verification', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: timestamp('expires_at').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow()
});
