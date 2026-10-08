export type Title = {
	native: string;
	romaji: null | string;
	english: null | string;
};

export type Anime = {
	id: number;
	title: Title;
	genres: string[];
};

export type AnimeSeason = {
	id: number;
	idMal: number | null;
	title: Title;
	format: 'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';
	season: 'WINTER' | 'SPRING' | 'SUMMER' | 'FALL';
	seasonYear: number;
	episodes: number;
	siteUrl: string;
};

export type CoverImage = {
	id: number;
	coverImage: {
		extraLarge: string;
		medium: string;
	};
	bannerImage: string | null;
	expDate: Date;
};
