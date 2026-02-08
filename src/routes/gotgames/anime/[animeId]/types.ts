import type { AnimeSeason, AnimeSeasonMetadata } from '$lib/server/db';

export type SeasonData = AnimeSeason & {
	animeSeasonMetadataId: string | null;
	anilistId: number | null;
	malId: number | null;
	note: string | null;
	status: string;
};
