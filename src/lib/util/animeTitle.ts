/** The nullable title fields shared by anime and anime-season records. */
export interface TitleFields {
	titleEnglish: string | null;
	titleRomaji: string | null;
	titleNative: string | null;
}

/**
 * Picks display title.
 * @param entity - Title fields.
 * @param fallback - Empty fallback.
 * @returns Title.
 */
export function getAnimeTitle(entity: TitleFields, fallback = ''): string {
	return entity.titleEnglish ?? entity.titleRomaji ?? entity.titleNative ?? fallback;
}
