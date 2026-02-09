# Flexible Schedule System - Schema Design

## Overview

This schema supports a highly flexible schedule system that allows mixing and matching anime seasons, handling season boundaries, and creating both templated (slot-based) and manual schedule entries.

---

## Core Tables

### **1. schedule_slot** (Templates for recurring entries)

```typescript
{
	scheduleSlotId: uuid; // Primary key
	dayOfWeek: smallint; // 0 = Sunday, 6 = Saturday
	time: time; // Stream time (e.g., "14:00")
	type: typeScheduleEntry; // 'anime', 'hololive', 'game', 'misc', etc.

	// Anime-specific fields (for type='anime')
	animeId: uuid; // Which anime series
	startingSequence: smallint; // Starting season (e.g., 2 for S2)
	startingEpisode: smallint; // Starting episode in that season (e.g., 5)
	episodeCount: smallint; // Episodes per stream (e.g., 4)

	// Non-anime fields
	title: varchar; // For misc/event entries or title override
	description: text; // For misc/event entries

	// Meta fields
	logoUrl: varchar; // Optional logo override
	cancelledText: text; // Default text if entry is cancelled
	note: text; // Internal admin notes
	isActive: boolean; // Enable/disable slot
	createdAt: date;
	updatedAt: date;
}
```

**Key Features**:

- Slots are **stateless templates** - they don't track progress
- Progress is calculated from existing `schedule_entry` records
- Can start from any season/episode (e.g., "S2 ep5" for ongoing reactions)
- `animeId` instead of `animeSeasonId` allows progression across all seasons

**Example Slot**:

```json
{
	"dayOfWeek": 1, // Monday
	"time": "14:00",
	"type": "anime",
	"animeId": "frieren-uuid",
	"startingSequence": 2, // Start from S2
	"startingEpisode": 5, // Start from ep5 of S2
	"episodeCount": 4, // 4 episodes per stream
	"isActive": true
}
```

---

### **2. schedule_entry** (Actual scheduled events)

```typescript
{
	scheduleEntryId: uuid; // Primary key
	scheduleId: uuid; // Link to weekly schedule
	type: typeScheduleEntry; // 'anime', 'misc', etc.
	date: date; // Specific date (e.g., "2024-01-15")
	time: time; // Stream time (can override slot)

	// Override fields
	title: varchar; // Title override or misc entry title
	description: text; // Description for misc entries
	logoUrl: varchar; // Logo override

	// Cancellation
	cancelledText: text; // Text to show if cancelled
	isCancelled: boolean; // Is this entry cancelled?

	note: text; // Admin notes
}
```

**Key Features**:

- **No direct anime reference** - anime links are in junction table
- Can be created from slot (auto-generated) or manually
- Supports overrides for title, logo, time
- Can be cancelled without deletion

---

### **3. schedule_entry_anime_season** (Junction table - CRITICAL!)

```typescript
{
  scheduleEntryId: uuid          // FK to schedule_entry
  animeSeasonId: uuid            // FK to anime_season
  episodes: text                 // Episode ranges (e.g., "1-4", "11-12", "1-3,7-9")

  PRIMARY KEY (scheduleEntryId, animeSeasonId)
}
```

**Key Features**:

- **Many-to-many** relationship
- One entry can have multiple anime seasons
- One entry can have multiple different anime
- Each anime season has its own episode range

**Example: Season Boundary Crossing**

```json
// Entry: Frieren S1 eps 11-12 + S2 eps 1-2 (4 total)
[
	{
		"scheduleEntryId": "entry-123",
		"animeSeasonId": "frieren-s1-uuid",
		"episodes": "11-12"
	},
	{
		"scheduleEntryId": "entry-123",
		"animeSeasonId": "frieren-s2-uuid",
		"episodes": "1-2"
	}
]
```

**Example: Multiple Different Anime**

```json
// Entry: Watch party with 3 different shows
[
	{
		"scheduleEntryId": "entry-456",
		"animeSeasonId": "frieren-s1-uuid",
		"episodes": "1"
	},
	{
		"scheduleEntryId": "entry-456",
		"animeSeasonId": "naruto-s1-uuid",
		"episodes": "1"
	},
	{
		"scheduleEntryId": "entry-456",
		"animeSeasonId": "noragami-s1-uuid",
		"episodes": "1"
	}
]
```

---

## Supporting Tables

### **4. schedule_entry_platform**

```typescript
{
  scheduleEntryId: uuid
  platformId: uuid
  PRIMARY KEY (scheduleEntryId, platformId)
}
```

Links schedule entries to platforms (YouTube, Twitch, etc.)

### **5. schedule_slot_platform**

```typescript
{
  scheduleSlotId: uuid
  platformId: uuid
  PRIMARY KEY (scheduleSlotId, platformId)
}
```

Default platforms for slot-generated entries

---

## Use Case Support

### ✅ **Use Case 1: Single Anime, Single Season, Fixed Episodes**

**Example**: Frieren S1, 1 episode per week

**Slot**:

```json
{
	"animeId": "frieren-uuid",
	"startingSequence": 1,
	"startingEpisode": 1,
	"episodeCount": 1
}
```

**Generated Entries**:

```
Entry 1: Frieren S1 ep1
Entry 2: Frieren S1 ep2
Entry 3: Frieren S1 ep3
```

**Schema**: One `schedule_entry_anime_season` per entry

---

### ✅ **Use Case 2: Season Boundary Crossing**

**Example**: Frieren, 4 eps/week, S1 has 13 episodes

**Slot**:

```json
{
	"animeId": "frieren-uuid",
	"startingSequence": 1,
	"startingEpisode": 1,
	"episodeCount": 4
}
```

**Logic**:

1. Query existing entries for this anime
2. Find highest episode watched across all seasons
3. Calculate next 4 episodes
4. If crossing season boundary, create 2 junction records

**Generated Entry 4**:

```json
// schedule_entry
{
  "scheduleEntryId": "entry-4",
  "type": "anime",
  "date": "2024-01-22"
}

// schedule_entry_anime_season
[
  {
    "scheduleEntryId": "entry-4",
    "animeSeasonId": "frieren-s1-uuid",
    "episodes": "13"            // Only 1 ep left in S1
  },
  {
    "scheduleEntryId": "entry-4",
    "animeSeasonId": "frieren-s2-uuid",
    "episodes": "1-3"           // Fill remaining 3 from S2
  }
]
```

---

### ✅ **Use Case 3: Multiple Different Anime**

**Example**: Watch party with 3 shows

**Manual Entry**:

```json
// schedule_entry
{
  "scheduleEntryId": "entry-watch-party",
  "type": "anime",
  "date": "2024-02-14",
  "title": "Valentine's Day Watch Party"
}

// schedule_entry_anime_season
[
  {
    "scheduleEntryId": "entry-watch-party",
    "animeSeasonId": "frieren-s1-uuid",
    "episodes": "1"
  },
  {
    "scheduleEntryId": "entry-watch-party",
    "animeSeasonId": "naruto-s1-uuid",
    "episodes": "1"
  },
  {
    "scheduleEntryId": "entry-watch-party",
    "animeSeasonId": "noragami-s1-uuid",
    "episodes": "1"
  }
]
```

---

### ✅ **Use Case 4: Non-Sequential Start**

**Example**: Starting from S2 onwards (ongoing reaction)

**Slot**:

```json
{
	"animeId": "frieren-uuid",
	"startingSequence": 2, // Start at S2
	"startingEpisode": 1, // From ep1 of S2
	"episodeCount": 3
}
```

**Logic**:

- Ignore S1 entirely
- Start progression from S2 ep1
- Continue through S3, S4, etc. as needed

---

### ✅ **Use Case 5: Variable Episode Count**

**Example**: Last entry has fewer episodes

**Logic**:

```typescript
// Slot says 4 eps/week
// S2 only has 10 episodes total
// Last watched: S2 ep8

nextEpisodes = calculateNextEpisodes(
  animeId: "frieren-uuid",
  lastWatchedSeason: 2,
  lastWatchedEpisode: 8,
  requestedCount: 4
)

// Returns: { S2: [9, 10] }  // Only 2 episodes!
// Auto-respects episode limits
```

---

### ✅ **Use Case 6: Manual Override**

**Example**: Slot says 4 eps, but watch 3 this week

**Process**:

1. Slot generates entry with 4 episodes
2. Admin reviews before saving
3. Admin manually changes to 3 episodes
4. Entry saved with override
5. Next slot generation calculates from actual progress

---

### ✅ **Use Case 7: OVAs, Movies, Specials**

**Example**: Watch S1, then OVA, then S2

**Schema Support**:

- Each season has `format` field (TV, OVA, MOVIE, etc.)
- Progression logic respects `sequence` ordering
- OVAs/Movies treated like any other season

**Example Progression**:

```
Frieren S1 (sequence=1, format=TV) eps 1-13
Frieren OVA (sequence=2, format=OVA) ep 1
Frieren S2 (sequence=3, format=TV) eps 1-12
```

---

### ✅ **Use Case 8: Skipping Episodes**

**Example**: Skip filler episodes

**Manual Entry**:

```json
{
	"scheduleEntryId": "entry-skip",
	"animeSeasonId": "naruto-s1-uuid",
	"episodes": "11-15" // Manually specify, skipping ep 10
}
```

**Logic**: Episode range parser accepts non-continuous ranges

---

## Episode Range Format

### **Supported Formats**

- Single: `"1"`
- Range: `"1-4"` (inclusive)
- Multiple ranges: `"1-3,7-9"`
- Mixed: `"1,3-5,7"`
- Non-continuous: `"1,2,4,7,9"`

### **Parsing Rules**

```typescript
"1-4"      → [1, 2, 3, 4]
"1-3,7-9"  → [1, 2, 3, 7, 8, 9]
"1,3,5"    → [1, 3, 5]
```

### **Formatting Rules**

```typescript
[1, 2, 3, 4]       → "1-4"
[1, 2, 3, 7, 8, 9] → "1-3,7-9"
[1, 3, 5]          → "1,3,5"
```

---

## UI Flow: Creating Entry from Slot

### **Algorithm**

```typescript
function generateEntryFromSlot(slot: ScheduleSlot, date: Date) {
  // 1. Get all existing entries for this anime
  const existingEntries = getEntriesForAnime(slot.animeId);

  // 2. Find highest episode watched across all seasons
  const { maxSequence, maxEpisode } = findMaxProgress(existingEntries);

  // 3. Determine next starting point
  let currentSequence = maxSequence;
  let currentEpisode = maxEpisode + 1;

  // If this is the first entry, use slot's starting point
  if (!existingEntries.length) {
    currentSequence = slot.startingSequence;
    currentEpisode = slot.startingEpisode;
  }

  // 4. Get anime seasons starting from current sequence
  const seasons = getAnimeSeasons(slot.animeId, fromSequence: currentSequence);

  // 5. Collect episodes across seasons until we hit episodeCount
  const episodesNeeded = slot.episodeCount;
  const animeSeasonLinks = [];
  let collected = 0;

  for (const season of seasons) {
    if (collected >= episodesNeeded) break;

    const availableEpisodes = season.episodes; // Total episodes in season
    const startEp = (season.sequence === currentSequence) ? currentEpisode : 1;
    const endEp = Math.min(startEp + (episodesNeeded - collected) - 1, availableEpisodes);

    const episodeRange = formatRange(startEp, endEp);
    animeSeasonLinks.push({
      animeSeasonId: season.animeSeasonId,
      episodes: episodeRange
    });

    collected += (endEp - startEp + 1);
    currentEpisode = 1; // Reset for next season
  }

  // 6. Create entry
  return {
    scheduleEntry: {
      date: date,
      time: slot.time,
      type: slot.type,
      // ... other fields
    },
    animeSeasons: animeSeasonLinks
  };
}
```

### **Example Execution**

```typescript
// Slot config
slot = {
	animeId: 'frieren-uuid',
	startingSequence: 1,
	startingEpisode: 1,
	episodeCount: 4
};

// Existing progress: S1 eps 1-10
existingEntries = [{ S1: '1-4' }, { S1: '5-8' }, { S1: '9-10' }];

// Next entry calculation
maxProgress = { sequence: 1, episode: 10 };
nextStart = { sequence: 1, episode: 11 };
episodesNeeded = 4;

// S1 has 13 episodes total
// S1 remaining: 11, 12, 13 (3 episodes)
// Need 1 more from S2

result = {
	scheduleEntry: { date: '2024-01-29', time: '14:00' },
	animeSeasons: [
		{ animeSeasonId: 'frieren-s1-uuid', episodes: '11-13' },
		{ animeSeasonId: 'frieren-s2-uuid', episodes: '1' }
	]
};
```

---

## Migration Notes

### **Old Schema → New Schema Mapping**

**Old**:

```
schedule_anime_detail
  └─ schedule_anime_episode
      └─ anime_episode (animeId, sequence, episodeNumber)
```

**New**:

```
schedule_entry
  └─ schedule_entry_anime_season
      ├─ animeSeasonId
      └─ episodes (ranges)
```

### **Migration Logic**

1. Group episodes by `(animeId, sequence)`
2. For each group, create one `schedule_entry_anime_season` record
3. Format episode numbers as ranges
4. Link to corresponding `animeSeasonId` via UUID mapping

### **Example Migration**

```
Old data:
schedule_anime_episode links to:
  - anime_episode (animeId=123, sequence=1, episodeNumber=11)
  - anime_episode (animeId=123, sequence=1, episodeNumber=12)
  - anime_episode (animeId=123, sequence=2, episodeNumber=1)
  - anime_episode (animeId=123, sequence=2, episodeNumber=2)

New data:
schedule_entry_anime_season [
  {
    animeSeasonId: "uuid-for-anime123-seq1",
    episodes: "11-12"
  },
  {
    animeSeasonId: "uuid-for-anime123-seq2",
    episodes: "1-2"
  }
]
```

---

## Summary

This schema provides:

✅ **Flexibility**: Mix any anime/seasons in a single entry
✅ **Slot Templates**: Reusable, stateless slot definitions
✅ **Progression**: Calculate next episodes from actual watch history
✅ **Season Boundaries**: Automatic spanning across seasons
✅ **Overrides**: Manual control when needed
✅ **Edge Cases**: Handles OVAs, fillers, variable episode counts
✅ **Migration**: Clean mapping from old schema

The junction table `schedule_entry_anime_season` is the key that enables all this flexibility!
