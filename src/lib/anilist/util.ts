import { compact } from 'lodash-es';

/**
 * Builds image query.
 * @param ids - Media ids.
 * @returns Query string.
 */
export function anilistImageQueryBuilder(ids: Array<number>): string {
	const blocks = ids.map((id, i) => {
		return `cover${i}: Media(id: ${id}) { id coverImage { extraLarge medium } bannerImage }`;
	});

	return `query { ${blocks.join(', ')} }`;
}

/**
 * Extracts numeric id from URL.
 * @param url - URL string.
 * @returns Id or null.
 */
export function extractId(url: string | null): number | null {
	if (!url) return null;

	const parts = compact(url.split('/'));
	const idPart = parts.find((part) => /^\d+$/.test(part));
	const id = Number(idPart);
	return Number.isFinite(id) ? id : null;
}
