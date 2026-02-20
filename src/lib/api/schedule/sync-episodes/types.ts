export interface APISyncEpisodesRequest {
	/** ISO date string (YYYY-MM-DD). Defaults to yesterday on the server if omitted. */
	date?: string;
}

export interface APISyncEpisodesResponse {
	success: boolean;
	message: string;
}
