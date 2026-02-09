# Database Migration Script

This script migrates data from the old Supabase database to the new Neon database.

## Prerequisites

Before running the migration, ensure:

1. **Both databases are accessible** via the connection strings in `.env`
2. **New database schema is deployed** (run `npm run db:push` on the new database first)
3. **Environment variables are set**:
   - `SUPABASE_DATABASE_URL` - Connection to old database
   - `VITE_DATABASE_URL` - Connection to new database

## What Gets Migrated

### ✅ Tables Migrated

- **genre** → UUID conversion
- **platform** → UUID conversion
- **anime** → UUID conversion
- **anime_genre** → UUID foreign keys
- **anime_season** → UUID conversion + `episodeProgress` calculation
- **anime_season_metadata** → New table, extracts AniList IDs from URLs
- **anime_link** → UUID foreign keys
- **schedule** → UUID conversion
- **schedule_entry** → UUID conversion + merges anime/misc details
- **schedule_entry_platform** → UUID foreign keys

### ❌ Tables NOT Migrated (not in new schema)

- `anime_episode` - Replaced by `episodeProgress` field
- `episode_link` - Removed from schema
- `schedule_anime_detail` - Merged into `schedule_entry`
- `schedule_anime_episode` - Merged into `schedule_entry.description`
- `schedule_misc_detail` - Merged into `schedule_entry`
- `anime_season_status` - Was a view, not needed
- `changelog` - Not in new schema
- `feedback` - Not in new schema
- `daily_users` - Not in new schema
- `users` - Better Auth handles authentication differently
- `schedule_slot` - New feature, will be created going forward

## Key Transformations

### 1. Episode Progress

**Old**: Individual `anime_episode` records with `watched` boolean
**New**: Single `episodeProgress` integer per `anime_season`

**Logic**: Finds the highest episode number where `watched = true`

Example:

- Episodes 1,2,3,5,7,9,15 are watched → `episodeProgress = 15`
- No episodes watched → `episodeProgress = 0`

### 2. AniList ID Extraction

**Old**: `anilistLink` varchar (e.g., "https://anilist.co/anime/12345")
**New**: `anilistId` integer in `anime_season_metadata`

**Logic**: Extracts numeric ID from URL using regex `/\/anime\/(\d+)/`

### 3. Schedule Entry Merging

#### For Anime Entries (`type = 'anime'`)

```
Old:
  schedule_entry
  ├─ schedule_anime_detail (links to anime)
  │   └─ schedule_anime_episode (which episodes)

New:
  schedule_entry (base info)
  └─ schedule_entry_anime_season (junction table)
      ├─ animeSeasonId (which season)
      └─ episodes (episode ranges for this season)
```

**Key Feature**: One schedule entry can now have **multiple anime seasons**!

Example: Watching Food Wars S1 episodes 10-12 AND S2 episodes 1-2 on the same day:

```
schedule_entry {
  date: "2024-01-15",
  type: "anime"
}
  └─ schedule_entry_anime_season records:
      - { animeSeasonId: "food-wars-s1-uuid", episodes: "10-12" }
      - { animeSeasonId: "food-wars-s2-uuid", episodes: "1-2" }
```

**Episode Range Formatting**:

- `[1,2,3,4]` → `"1-4"`
- `[1,2,3,7,8,9]` → `"1-3,7-9"`
- `[5]` → `"5"`

#### For Misc Entries (`type = 'misc'`)

```
Old:
  schedule_entry
  └─ schedule_misc_detail
      ├─ title
      └─ description

New:
  schedule_entry
  ├─ title (direct field)
  └─ description (direct field)
```

### 4. UUID Conversion

All `serial` integer IDs are converted to UUIDs. The script maintains internal mappings to preserve relationships.

## Running the Migration

### Step 1: Verify Environment

Ensure your `.env` file contains:

```env
SUPABASE_DATABASE_URL=postgresql://...
VITE_DATABASE_URL=postgresql://...
```

### Step 2: Deploy New Schema

```bash
npm run db:push
```

This ensures the new database has the correct schema before migration.

### Step 3: Run Migration

```bash
npm run db:transfer
```

## Migration Output

The script will show:

1. **Progress logs** for each table being migrated
2. **Statistics** showing old count vs new count
3. **Error list** if any records failed to migrate

Example output:

```
========================================
🚀 Starting Database Migration
========================================

[2024-01-15T10:30:00.000Z] Testing database connections...
[2024-01-15T10:30:01.000Z] ✓ Database connections successful

[2024-01-15T10:30:01.500Z] Starting genre migration...
[2024-01-15T10:30:02.000Z] ✓ Migrated 42/42 genres
...

========================================
✅ Migration Complete!
========================================

Migration Statistics:
─────────────────────────────────────
genre                     42/42
platform                  8/8
anime                     156/156
animeGenre                524/524
animeSeason               287/287
animeSeasonMetadata       287/287
animeLink                 312/312
schedule                  52/52
scheduleEntry             428/428
scheduleEntryPlatform     856/856

✨ No errors encountered!
```

## Troubleshooting

### Connection Errors

If you see connection errors, verify:

- Both database URLs are correct
- Databases are accessible from your network
- Connection strings include proper credentials

### Missing Mappings

If you see "Missing mapping" errors:

- Check that all foreign key references exist in old database
- Verify data integrity in source database

### AniList ID Extraction Failures

If AniList IDs can't be extracted:

- Check the format of `anilistLink` in old database
- These errors won't stop migration, just logged for manual review

### Failed Migrations

The script does NOT use transactions by default. If migration fails:

1. Clear the new database
2. Fix the issue
3. Re-run the migration

## Post-Migration

After successful migration:

1. **Verify data** in new database using SQL queries or Drizzle Studio
2. **Test your application** with the new database
3. **Keep old database** as backup until fully confident
4. **Update application** to use `VITE_DATABASE_URL`

## Notes

- The migration script is **idempotent-ish** - running it twice will create duplicate UUIDs, so clear the new database first if re-running
- Old database is **read-only** during migration (no changes made)
- Migration time depends on data size (expect ~1-5 minutes for typical datasets)
- All timestamps are preserved where applicable
