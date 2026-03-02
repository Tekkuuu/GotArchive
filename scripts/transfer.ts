import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, sql } from 'drizzle-orm';
import { config } from 'dotenv';
import * as oldSchema from './schema';
import * as newSchema from '../src/lib/server/db/schema';

// Load environment variables from .env file
config();

// Database connections
if (!process.env.SUPABASE_DATABASE_URL) throw new Error('SUPABASE_DATABASE_URL is not set');
if (!process.env.VITE_DATABASE_URL) throw new Error('VITE_DATABASE_URL is not set');

const oldClient = postgres(process.env.SUPABASE_DATABASE_URL, { prepare: false });
const newClient = postgres(process.env.VITE_DATABASE_URL, { prepare: false });

const oldDb = drizzle(oldClient, { schema: oldSchema });
const newDb = drizzle(newClient, { schema: newSchema });

// ID mapping storage
const idMaps = {
	genre: new Map<number, string>(),
	platform: new Map<number, string>(),
	anime: new Map<number, string>(),
	animeSeason: new Map<string, string>(), // 'animeId-sequence' → uuid
	schedule: new Map<number, string>(),
	scheduleEntry: new Map<number, string>()
};

// Statistics tracking
const stats = {
	genre: { old: 0, new: 0 },
	platform: { old: 0, new: 0 },
	anime: { old: 0, new: 0 },
	animeGenre: { old: 0, new: 0 },
	animeSeason: { old: 0, new: 0 },
	animeSeasonMetadata: { old: 0, new: 0 },
	animeLink: { old: 0, new: 0 },
	schedule: { old: 0, new: 0 },
	scheduleEntry: { old: 0, new: 0 },
	scheduleEntryAnimeSeason: { old: 0, new: 0 },
	scheduleEntryPlatform: { old: 0, new: 0 }
};

const errors: string[] = [];

// ============================================
// Helper Functions
// ============================================

/**
 * Extract AniList ID from URL
 * Examples: "https://anilist.co/anime/12345" → 12345
 */
function extractAnilistId(url: string): number | null {
	if (!url) return null;
	const match = url.match(/\/anime\/(\d+)/);
	return match ? parseInt(match[1], 10) : null;
}

/**
 * Format episode numbers into compact ranges
 * Examples: [1,2,3,4] → "1-4", [1,2,3,7,8,9] → "1-3,7-9"
 */
function formatEpisodeRanges(episodes: number[]): string {
	if (episodes.length === 0) return '';

	const sorted = [...episodes].sort((a, b) => a - b);
	const ranges: string[] = [];
	let rangeStart = sorted[0];
	let rangeEnd = sorted[0];

	for (let i = 1; i < sorted.length; i++) {
		if (sorted[i] === rangeEnd + 1) {
			// Continue range
			rangeEnd = sorted[i];
		} else {
			// End current range and start new one
			ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);
			rangeStart = sorted[i];
			rangeEnd = sorted[i];
		}
	}

	// Add final range
	ranges.push(rangeStart === rangeEnd ? `${rangeStart}` : `${rangeStart}-${rangeEnd}`);

	return ranges.join(',');
}

/**
 * Generate UUID v4
 */
function generateUuid(): string {
	return crypto.randomUUID();
}

/**
 * Log progress with timestamp
 */
function log(message: string) {
	console.log(`[${new Date().toISOString()}] ${message}`);
}

// ============================================
// Migration Functions
// ============================================

async function migrateGenres() {
	log('Starting genre migration...');

	const oldGenres = await oldDb.select().from(oldSchema.genre);
	stats.genre.old = oldGenres.length;

	for (const oldGenre of oldGenres) {
		const newId = generateUuid();
		idMaps.genre.set(oldGenre.genreId, newId);

		await newDb.insert(newSchema.genre).values({
			genreId: newId,
			name: oldGenre.name
		});

		stats.genre.new++;
	}

	log(`✓ Migrated ${stats.genre.new}/${stats.genre.old} genres`);
}

async function migratePlatforms() {
	log('Starting platform migration...');

	const oldPlatforms = await oldDb.select().from(oldSchema.platform);
	stats.platform.old = oldPlatforms.length;

	for (const oldPlatform of oldPlatforms) {
		const newId = generateUuid();
		idMaps.platform.set(oldPlatform.platformId, newId);

		await newDb.insert(newSchema.platform).values({
			platformId: newId,
			name: oldPlatform.name,
			url: oldPlatform.url
		});

		stats.platform.new++;
	}

	log(`✓ Migrated ${stats.platform.new}/${stats.platform.old} platforms`);
}

async function migrateAnime() {
	log('Starting anime migration...');

	const oldAnimes = await oldDb.select().from(oldSchema.anime);
	stats.anime.old = oldAnimes.length;

	for (const oldAnime of oldAnimes) {
		const newId = generateUuid();
		idMaps.anime.set(oldAnime.animeId, newId);

		await newDb.insert(newSchema.anime).values({
			animeId: newId,
			titleNative: oldAnime.titleNative,
			titleRomaji: oldAnime.titleRomaji,
			titleEnglish: oldAnime.titleEnglish,
			logoUrl: oldAnime.logoUrl,
			shortTitle: oldAnime.shortTitle
		});

		stats.anime.new++;
	}

	log(`✓ Migrated ${stats.anime.new}/${stats.anime.old} anime`);
}

async function migrateAnimeGenres() {
	log('Starting anime_genre migration...');

	const oldAnimeGenres = await oldDb.select().from(oldSchema.animeGenre);
	stats.animeGenre.old = oldAnimeGenres.length;

	for (const oldAnimeGenre of oldAnimeGenres) {
		const newAnimeId = idMaps.anime.get(oldAnimeGenre.animeId);
		const newGenreId = idMaps.genre.get(oldAnimeGenre.genreId);

		if (!newAnimeId || !newGenreId) {
			errors.push(
				`anime_genre: Missing mapping for animeId=${oldAnimeGenre.animeId} or genreId=${oldAnimeGenre.genreId}`
			);
			continue;
		}

		await newDb.insert(newSchema.animeGenre).values({
			animeId: newAnimeId,
			genreId: newGenreId
		});

		stats.animeGenre.new++;
	}

	log(`✓ Migrated ${stats.animeGenre.new}/${stats.animeGenre.old} anime-genre links`);
}

async function migrateAnimeSeasons() {
	log('Starting anime_season migration...');

	const oldAnimeSeasons = await oldDb.select().from(oldSchema.animeSeason);
	stats.animeSeason.old = oldAnimeSeasons.length;

	for (const oldSeason of oldAnimeSeasons) {
		const newAnimeId = idMaps.anime.get(oldSeason.animeId);

		if (!newAnimeId) {
			errors.push(`anime_season: Missing anime mapping for animeId=${oldSeason.animeId}`);
			continue;
		}

		// Calculate episode progress: MAX(episode_number) WHERE watched = true
		const watchedEpisodes = await oldDb
			.select({ episodeNumber: oldSchema.animeEpisode.episodeNumber })
			.from(oldSchema.animeEpisode)
			.where(
				sql`${oldSchema.animeEpisode.animeId} = ${oldSeason.animeId} 
            AND ${oldSchema.animeEpisode.sequence} = ${oldSeason.sequence} 
            AND ${oldSchema.animeEpisode.watched} = true`
			);

		const episodeProgress =
			watchedEpisodes.length > 0 ? Math.max(...watchedEpisodes.map((e) => e.episodeNumber)) : 0;

		const newSeasonId = generateUuid();
		const mapKey = `${oldSeason.animeId}-${oldSeason.sequence}`;
		idMaps.animeSeason.set(mapKey, newSeasonId);

		await newDb.insert(newSchema.animeSeason).values({
			animeSeasonId: newSeasonId,
			animeId: newAnimeId,
			sequence: oldSeason.sequence,
			format: oldSeason.format,
			titleNative: oldSeason.titleNative,
			titleRomaji: oldSeason.titleRomaji,
			titleEnglish: oldSeason.titleEnglish,
			shortTitle: oldSeason.shortTitle,
			season: oldSeason.season,
			year: oldSeason.year,
			episodes: oldSeason.episodes,
			episodeProgress: episodeProgress
		});

		stats.animeSeason.new++;
	}

	log(`✓ Migrated ${stats.animeSeason.new}/${stats.animeSeason.old} anime seasons`);
}

async function migrateAnimeSeasonMetadata() {
	log('Starting anime_season_metadata migration...');

	const oldAnimeSeasons = await oldDb.select().from(oldSchema.animeSeason);
	stats.animeSeasonMetadata.old = oldAnimeSeasons.length;

	for (const oldSeason of oldAnimeSeasons) {
		const mapKey = `${oldSeason.animeId}-${oldSeason.sequence}`;
		const newSeasonId = idMaps.animeSeason.get(mapKey);

		if (!newSeasonId) {
			errors.push(`anime_season_metadata: Missing season mapping for ${mapKey}`);
			continue;
		}

		// Extract AniList ID from URL
		const anilistId = extractAnilistId(oldSeason.anilistLink);

		if (!anilistId) {
			errors.push(
				`anime_season_metadata: Could not extract AniList ID from "${oldSeason.anilistLink}" for season ${mapKey}`
			);
		}

		const newMetadataId = generateUuid();

		await newDb.insert(newSchema.animeSeasonMetadata).values({
			animeSeasonMetadataId: newMetadataId,
			animeSeasonId: newSeasonId,
			anilistId: anilistId,
			malId: null,
			note: null
		});

		stats.animeSeasonMetadata.new++;
	}

	log(
		`✓ Migrated ${stats.animeSeasonMetadata.new}/${stats.animeSeasonMetadata.old} anime season metadata`
	);
}

async function migrateAnimeLinks() {
	log('Starting anime_link migration...');

	const oldAnimeLinks = await oldDb.select().from(oldSchema.animeLink);
	stats.animeLink.old = oldAnimeLinks.length;

	for (const oldLink of oldAnimeLinks) {
		const newAnimeId = idMaps.anime.get(oldLink.animeId);
		const newPlatformId = idMaps.platform.get(oldLink.platformId);

		if (!newAnimeId || !newPlatformId) {
			errors.push(
				`anime_link: Missing mapping for animeId=${oldLink.animeId} or platformId=${oldLink.platformId}`
			);
			continue;
		}

		await newDb.insert(newSchema.animeLink).values({
			animeId: newAnimeId,
			url: oldLink.url,
			platformId: newPlatformId,
			note: oldLink.note
		});

		stats.animeLink.new++;
	}

	log(`✓ Migrated ${stats.animeLink.new}/${stats.animeLink.old} anime links`);
}

async function migrateSchedules() {
	log('Starting schedule migration...');

	const oldSchedules = await oldDb.select().from(oldSchema.schedule);
	stats.schedule.old = oldSchedules.length;

	for (const oldSchedule of oldSchedules) {
		const newId = generateUuid();
		idMaps.schedule.set(oldSchedule.scheduleId, newId);

		await newDb.insert(newSchema.schedule).values({
			scheduleId: newId,
			year: oldSchedule.year,
			week: oldSchedule.week,
			note: oldSchedule.note,
			preview: oldSchedule.preview
		});

		stats.schedule.new++;
	}

	log(`✓ Migrated ${stats.schedule.new}/${stats.schedule.old} schedules`);
}

async function migrateScheduleEntries() {
	log('Starting schedule_entry migration...');

	const oldScheduleEntries = await oldDb.select().from(oldSchema.scheduleEntry);
	stats.scheduleEntry.old = oldScheduleEntries.length;

	for (const oldEntry of oldScheduleEntries) {
		const newScheduleId = idMaps.schedule.get(oldEntry.scheduleId);

		if (!newScheduleId) {
			errors.push(`schedule_entry: Missing schedule mapping for scheduleId=${oldEntry.scheduleId}`);
			continue;
		}

		const newEntryId = generateUuid();
		idMaps.scheduleEntry.set(oldEntry.scheduleEntryId, newEntryId);

		let title: string | null = null;
		let description: string | null = null;
		const animeSeasons: Array<{ animeSeasonId: string; episodes: string }> = [];

		// Handle anime entries
		if (oldEntry.type === 'anime') {
			// Get ALL anime details for this entry (one per season)
			const animeDetails = await oldDb
				.select()
				.from(oldSchema.scheduleAnimeDetail)
				.where(eq(oldSchema.scheduleAnimeDetail.scheduleEntryId, oldEntry.scheduleEntryId));

			// Collect all episodes across every detail row, grouped by anime season
			const episodesBySeason = new Map<string, number[]>();

			for (const detail of animeDetails) {
				const animeEpisodes = await oldDb
					.select({
						animeId: oldSchema.animeEpisode.animeId,
						sequence: oldSchema.animeEpisode.sequence,
						episodeNumber: oldSchema.animeEpisode.episodeNumber
					})
					.from(oldSchema.scheduleAnimeEpisode)
					.innerJoin(
						oldSchema.animeEpisode,
						eq(oldSchema.scheduleAnimeEpisode.animeEpisodeId, oldSchema.animeEpisode.animeEpisodeId)
					)
					.where(
						eq(oldSchema.scheduleAnimeEpisode.scheduleAnimeDetailId, detail.scheduleAnimeDetailId)
					);

				for (const episode of animeEpisodes) {
					const mapKey = `${episode.animeId}-${episode.sequence}`;
					if (!episodesBySeason.has(mapKey)) {
						episodesBySeason.set(mapKey, []);
					}
					episodesBySeason.get(mapKey)!.push(episode.episodeNumber);
				}
			}

			// Create a scheduleEntryAnimeSeason record for each season
			for (const [mapKey, episodeNumbers] of episodesBySeason.entries()) {
				const animeSeasonId = idMaps.animeSeason.get(mapKey);

				if (!animeSeasonId) {
					errors.push(`schedule_entry: Could not find anime season mapping for ${mapKey}`);
					continue;
				}

				const episodeRange = formatEpisodeRanges(episodeNumbers);
				animeSeasons.push({ animeSeasonId, episodes: episodeRange });
			}
		}

		// Handle misc entries
		if (oldEntry.type === 'misc') {
			const miscDetail = await oldDb
				.select()
				.from(oldSchema.scheduleMiscDetail)
				.where(eq(oldSchema.scheduleMiscDetail.scheduleEntryId, oldEntry.scheduleEntryId))
				.limit(1);

			if (miscDetail.length > 0) {
				title = miscDetail[0].title;
				description = miscDetail[0].description;
			}
		}

		// Insert schedule entry
		await newDb.insert(newSchema.scheduleEntry).values({
			scheduleEntryId: newEntryId,
			scheduleId: newScheduleId,
			type: oldEntry.type,
			date: oldEntry.date,
			time: oldEntry.time,
			note: oldEntry.note,
			logoUrl: null, // New feature, not in old schema
			title: title,
			description: description,
			cancelledText: null, // New feature
			isCancelled: false // New feature
		});

		// Insert anime season links
		for (const animeSeason of animeSeasons) {
			await newDb.insert(newSchema.scheduleEntryAnimeSeason).values({
				scheduleEntryId: newEntryId,
				animeSeasonId: animeSeason.animeSeasonId,
				episodes: animeSeason.episodes
			});
			stats.scheduleEntryAnimeSeason.new++;
		}

		stats.scheduleEntry.new++;
	}

	log(`✓ Migrated ${stats.scheduleEntry.new}/${stats.scheduleEntry.old} schedule entries`);
	log(`✓ Created ${stats.scheduleEntryAnimeSeason.new} schedule-anime season links`);
}

async function migrateScheduleEntryPlatforms() {
	log('Starting schedule_entry_platform migration...');

	const oldPlatforms = await oldDb.select().from(oldSchema.scheduleEntryPlatform);
	stats.scheduleEntryPlatform.old = oldPlatforms.length;

	for (const oldPlatform of oldPlatforms) {
		const newEntryId = idMaps.scheduleEntry.get(oldPlatform.scheduleEntryId);
		const newPlatformId = idMaps.platform.get(oldPlatform.platformId);

		if (!newEntryId || !newPlatformId) {
			errors.push(
				`schedule_entry_platform: Missing mapping for scheduleEntryId=${oldPlatform.scheduleEntryId} or platformId=${oldPlatform.platformId}`
			);
			continue;
		}

		await newDb.insert(newSchema.scheduleEntryPlatform).values({
			scheduleEntryId: newEntryId,
			platformId: newPlatformId
		});

		stats.scheduleEntryPlatform.new++;
	}

	log(
		`✓ Migrated ${stats.scheduleEntryPlatform.new}/${stats.scheduleEntryPlatform.old} schedule entry platforms`
	);
}

// ============================================
// Main Migration Flow
// ============================================

async function main() {
	console.log('\n========================================');
	console.log('🚀 Starting Database Migration');
	console.log('========================================\n');

	try {
		// Test connections
		log('Testing database connections...');
		await oldDb.select().from(oldSchema.genre).limit(1);
		await newDb.select().from(newSchema.genre).limit(1);
		log('✓ Database connections successful\n');

		// Execute migrations in order
		await migrateGenres();
		await migratePlatforms();
		await migrateAnime();
		await migrateAnimeGenres();
		await migrateAnimeSeasons();
		await migrateAnimeSeasonMetadata();
		await migrateAnimeLinks();
		await migrateSchedules();
		await migrateScheduleEntries();
		await migrateScheduleEntryPlatforms();

		// Print summary
		console.log('\n========================================');
		console.log('✅ Migration Complete!');
		console.log('========================================\n');

		console.log('Migration Statistics:');
		console.log('─────────────────────────────────────');
		for (const [table, counts] of Object.entries(stats)) {
			console.log(`${table.padEnd(25)} ${counts.new}/${counts.old}`);
		}

		if (errors.length > 0) {
			console.log('\n⚠️  Errors encountered during migration:');
			console.log('─────────────────────────────────────');
			errors.forEach((error) => console.log(`  - ${error}`));
		} else {
			console.log('\n✨ No errors encountered!');
		}
	} catch (error) {
		console.error('\n❌ Migration failed with error:');
		console.error(error);
		process.exit(1);
	} finally {
		await oldClient.end();
		await newClient.end();
	}
}

// Run migration
main();
