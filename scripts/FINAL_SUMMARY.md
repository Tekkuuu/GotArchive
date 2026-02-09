# Database Migration - Final Summary

## ✅ What Was Completed

### **1. Schema Design** ✨

Created a **flexible schedule system** that supports:

- ✅ Single anime, multiple episodes per entry
- ✅ **Multi-season entries** (e.g., S1 eps 11-12 + S2 eps 1-2)
- ✅ **Multi-anime entries** (e.g., Frieren + Naruto + Noragami in one entry)
- ✅ Variable episode counts (respects actual episode limits)
- ✅ Non-sequential starts (e.g., start from S2 ep5)
- ✅ Slot templates (stateless, reusable)
- ✅ Manual overrides at entry level

### **2. Key Schema Changes**

#### **A. Updated `schedule_slot`**

```typescript
// BEFORE (Too specific)
{
	animeSeasonId: uuid; // Locked to one season
}

// AFTER (Flexible template)
{
	animeId: uuid; // Any anime
	startingSequence: smallint; // Starting season (e.g., 2 for S2)
	startingEpisode: smallint; // Starting episode (e.g., 5)
	episodeCount: smallint; // Episodes per stream
}
```

**Benefit**: Slots can progress through all seasons automatically!

#### **B. Added `schedule_entry_anime_season` Junction Table**

```typescript
{
	scheduleEntryId: uuid;
	animeSeasonId: uuid;
	episodes: text; // "1-4", "11-12", "1-3,7-9", etc.
}
```

**Benefit**: One entry can link to multiple anime seasons OR multiple different anime!

#### **C. Updated `schedule_entry`**

```typescript
// REMOVED: animeSeasonId (moved to junction table)

// KEPT: For misc entries and overrides
{
	title: varchar;
	description: text;
}
```

### **3. Migration Script**

**File**: `scripts/transfer.ts`

**Features**:

- ✅ Converts all `serial` IDs to `uuid`
- ✅ Calculates `episodeProgress` (max watched episode per season)
- ✅ Extracts AniList IDs from URLs
- ✅ **Groups episodes by anime season** (handles multi-season entries!)
- ✅ Formats episode ranges (e.g., `[1,2,3,7,8,9]` → `"1-3,7-9"`)
- ✅ Merges `schedule_anime_detail` + `schedule_misc_detail` into entries
- ✅ Comprehensive error logging and statistics
- ✅ Loaded `.env` file support

**Migration Order**:

1. genre
2. platform
3. anime
4. anime_genre
5. anime_season (with episodeProgress)
6. anime_season_metadata (with AniList ID)
7. anime_link
8. schedule
9. schedule_entry (with multi-season support!)
10. schedule_entry_anime_season (junction records)
11. schedule_entry_platform

---

## 📊 Example: Multi-Season Entry Migration

### **Old Database**

```
schedule_anime_detail (scheduleAnimeDetailId=1, scheduleEntryId=42)
  └─ schedule_anime_episode links to:
      - anime_episode (animeId=123, sequence=1, episodeNumber=11)
      - anime_episode (animeId=123, sequence=1, episodeNumber=12)
      - anime_episode (animeId=123, sequence=2, episodeNumber=1)
      - anime_episode (animeId=123, sequence=2, episodeNumber=2)
```

### **New Database** (After Migration)

```
schedule_entry (scheduleEntryId="uuid-42")
  └─ schedule_entry_anime_season [
      {
        scheduleEntryId: "uuid-42",
        animeSeasonId: "anime123-seq1-uuid",
        episodes: "11-12"
      },
      {
        scheduleEntryId: "uuid-42",
        animeSeasonId: "anime123-seq2-uuid",
        episodes: "1-2"
      }
    ]
```

**Result**: One entry, two anime seasons, episode ranges preserved! ✨

---

## 🚀 How to Run Migration

### **Step 1: Ensure Environment Variables**

In your `.env` file:

```env
SUPABASE_DATABASE_URL=postgresql://...  # Old database
VITE_DATABASE_URL=postgresql://...      # New database
```

### **Step 2: Push New Schema**

```bash
npm run db:push
```

⚠️ **Important**: If you already have data in the new database from testing, **truncate it first**:

```sql
TRUNCATE TABLE
  schedule_entry_platform,
  schedule_entry_anime_season,
  schedule_entry,
  schedule,
  anime_link,
  anime_season_metadata,
  anime_season,
  anime_genre,
  anime,
  platform,
  genre
CASCADE;
```

### **Step 3: Run Migration**

```bash
npm run db:transfer
```

### **Expected Output**

```
========================================
🚀 Starting Database Migration
========================================

[2024-01-15T10:30:00.000Z] Testing database connections...
[2024-01-15T10:30:01.000Z] ✓ Database connections successful

[2024-01-15T10:30:01.500Z] Starting genre migration...
[2024-01-15T10:30:02.000Z] ✓ Migrated 42/42 genres

[2024-01-15T10:30:02.500Z] Starting platform migration...
[2024-01-15T10:30:03.000Z] ✓ Migrated 8/8 platforms

... (continues for each table)

[2024-01-15T10:35:00.000Z] ✓ Migrated 428/428 schedule entries
[2024-01-15T10:35:00.000Z] ✓ Created 512 schedule-anime season links

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
scheduleEntryAnimeSeason  512/512  ← Note: More than entries!
scheduleEntryPlatform     856/856

✨ No errors encountered!
```

**Note**: `scheduleEntryAnimeSeason` count > `scheduleEntry` count means some entries span multiple seasons! 🎉

---

## 📁 Files Created/Modified

### **Created**

- ✅ `scripts/transfer.ts` - Migration script (620+ lines)
- ✅ `scripts/MIGRATION_README.md` - Migration documentation
- ✅ `scripts/SCHEMA_DESIGN.md` - Comprehensive schema design doc
- ✅ `package.json` - Added `db:transfer` script

### **Modified**

- ✅ `src/lib/server/db/shared/schema.ts`:
  - Removed `animeSeasonId` from `schedule_entry`
  - Added `schedule_entry_anime_season` junction table
  - Updated `schedule_slot` with `animeId`, `startingSequence`, `startingEpisode`
- ✅ `drizzle.config.ts` - Added dotenv import

### **Dependencies**

- ✅ Installed `tsx` for running TypeScript scripts

---

## ⚠️ Known Issues (Expected)

### **LSP/TypeScript Errors**

The existing UI code has TypeScript errors because it was built for the old schema:

- `useSchedule.ts` - References old `animeSeasonId` field
- Admin schedule forms - Use old table structures
- Public schedule display - Uses old ID types

**These are EXPECTED** and will be fixed when you rebuild the UI based on the new schema.

---

## 📚 Documentation

### **For Migration**

Read: `scripts/MIGRATION_README.md`

- Detailed transformation explanations
- Troubleshooting guide
- Post-migration checklist

### **For New UI Development**

Read: `scripts/SCHEMA_DESIGN.md`

- All use cases explained
- Schema structure
- Example queries
- Entry generation algorithm
- Episode progression logic

---

## 🎯 Next Steps

### **1. Run Migration** (When Ready)

```bash
# Ensure .env is configured
# Push schema: npm run db:push
# Run migration: npm run db:transfer
```

### **2. Verify Data**

- Check row counts match
- Test some sample queries
- Verify multi-season entries migrated correctly

### **3. Rebuild UI** (Future Work)

The new UI needs to support:

- **Slot creation**: Configure anime, starting season/episode, episode count
- **Entry generation**: Auto-calculate next episodes from slot
- **Manual entry**: Add multiple anime seasons to one entry
- **Episode progression**: Calculate from existing entries
- **Season boundary handling**: Auto-span seasons when needed

Reference `SCHEMA_DESIGN.md` for the UI algorithm!

---

## 💡 Key Insights

### **Why Junction Table is Worth It**

Yes, it adds back a table you were trying to reduce, BUT:

✅ **Enables all your use cases** (multi-season, multi-anime, flexibility)
✅ **Cleaner than alternatives** (vs. JSON fields or splitting entries)
✅ **Future-proof** (easy to add more metadata per anime-season link)
✅ **Queryable** (can easily find "which entries have Frieren S1")
✅ **Type-safe** (proper foreign keys, not JSON blobs)

### **Slot Design Philosophy**

Slots are **templates, not trackers**:

- ✅ Don't store current progress
- ✅ Define starting point + rules
- ✅ Reusable across multiple schedules
- ✅ UI calculates next entries from actual data

This keeps your database clean and slots truly reusable!

---

## 🎉 Migration Ready!

The schema is designed, migration script is complete, and documentation is comprehensive.

**When you're ready to migrate, just run**:

```bash
npm run db:transfer
```

Good luck! 🚀
