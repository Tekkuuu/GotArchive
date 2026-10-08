import { uniq } from 'lodash-es';

/**
 * Parses episode ranges.
 * @param s - Range string e.g. "1-4,5".
 * @returns Sorted ids.
 */
export function parseEpisodeList(description: string | null): number[] {
	if (!description) return [];

	const episodes: number[] = [];

	const ranges = description.split(',').map((s) => s.trim());

	for (const range of ranges) {
		const hyphenIndex = range.indexOf('-');
		if (hyphenIndex !== -1) {
			const start = parseInt(range.substring(0, hyphenIndex).trim());
			const end = parseInt(range.substring(hyphenIndex + 1).trim());
			if (!isNaN(start) && !isNaN(end)) {
				for (let ep = start; ep <= end; ep++) {
					episodes.push(ep);
				}
			}
		} else {
			const episode = parseInt(range.trim());
			if (!isNaN(episode)) {
				episodes.push(episode);
			}
		}
	}

	return uniq(episodes).sort((a, b) => a - b);
}

/**
 * Formats ids to range string.
 * @param ids - Episode ids.
 * @returns Range string.
 */
export function formatEpisodeList(episodes: number[] | null | undefined): string {
	if (!episodes || episodes.length === 0) return '';

	const sorted = uniq(episodes).sort((a, b) => a - b);
	const ranges: string[] = [];
	let start = sorted[0];
	let prev = sorted[0];

	for (let i = 1; i < sorted.length; i++) {
		const current = sorted[i];
		if (current === prev + 1) {
			prev = current;
			continue;
		}
		ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
		start = current;
		prev = current;
	}
	ranges.push(start === prev ? `${start}` : `${start}-${prev}`);

	return ranges.join(',');
}
