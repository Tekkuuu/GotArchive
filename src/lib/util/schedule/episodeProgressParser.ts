import _ from 'lodash';

/**
 * Parses episode range from description string and returns array of episode numbers.
 * Supports formats like "1-4", "5", "1,3,5", "1-3,5".
 * Returns sorted unique array of episode numbers.
 */
export function parseEpisodeList(description: string | null): number[] {
	if (!description) return [];

	const episodes: number[] = [];

	// Split by comma for multiple ranges
	const ranges = description.split(',').map((s) => s.trim());

	for (const range of ranges) {
		// Check for hyphen range like "1-4"
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
			// Single episode
			const episode = parseInt(range.trim());
			if (!isNaN(episode)) {
				episodes.push(episode);
			}
		}
	}

	return _.uniq(episodes).sort((a, b) => a - b);
}
